/**
 * Single gateway to the backend. Feature modules call this through their
 * own <feature>/api.ts; components never call fetch directly.
 *
 * NEXT_PUBLIC_API_URL empty -> features fall back to their mock.ts data.
 *
 * Backend envelope note (2026-11-10, fullstack connect): the real
 * backend answers `{ success, message, data }`, NOT the contract
 * envelope `{ data, meta }` / `{ error: { code, message } }`.
 * apiFetch normalizes the backend envelope into the contract shape
 * here, so call sites keep reading `res.data` unchanged.
 */

import { getSession, setSession } from "@/features/auth/session";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  ""
);

/** True when a real backend base URL is configured. */
export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

/** localStorage key the login screen reads once to show why a
 *  mid-session suspension kicked the user out (see LoginForm). */
export const SUSPENDED_NOTICE_KEY = "uf-suspended-notice";

let suspendedKickDone = false;

/**
 * A suspended account loses API access entirely (the backend
 * AuthMiddleware 403s every call), so a session that was alive when
 * the suspension landed would otherwise sit on a frozen app. Clear
 * the session, stash the suspension payload for the login screen,
 * and send the user there.
 */
function handleSuspendedKick(data: unknown): void {
  if (typeof window === "undefined" || suspendedKickDone) return;
  if (window.location.pathname.startsWith("/login")) return;
  const session = getSession();
  if (!session) return;
  suspendedKickDone = true;
  try {
    window.localStorage.setItem(
      SUSPENDED_NOTICE_KEY,
      JSON.stringify({ payload: data, username: session.user.username }),
    );
  } catch {
    // Storage full/blocked: the redirect still applies.
  }
  setSession(null);
  window.location.assign("/login");
}

/** Raw base URL for endpoints whose envelope differs from the contract (auth adapter). */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Contract envelope (docs/api-contract.md §Conventions): list/summary
 * endpoints return `{ data, meta }`, never bare arrays. Typing it here
 * means the mock → fetch swap cannot silently change call sites
 * (audit P1-A #8).
 */
export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  /**
   * Backend pagination meta (GET /api/collab, audit P2-12): the backend
   * answers `{ success, message, data, pagination }` and apiFetch copies
   * `pagination` through here. Absent on endpoints without pagination.
   */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Contract error shape (docs/api-contract.md §Conventions):
 * `{ error: { code, message } }` with a proper HTTP status.
 * Thrown by apiFetch so callers can branch on `code` (audit P1-A #11).
 */
export class ApiError extends Error {
  readonly status: number;
  /** Machine code from the error envelope, e.g. "unauthorized". */
  readonly code?: string;
  /** The error envelope's data payload, when the backend sent one
   *  (e.g. { blocked_projects: 2 } on a 409). */
  readonly data?: unknown;

  constructor(
    status: number,
    code: string | undefined,
    message: string,
    data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Typed fetch against the backend. Throws ApiError on non-2xx.
 * - FormData bodies skip the JSON Content-Type header so the browser sets
 *   the multipart boundary itself (audit P1-A #10).
 * - Non-2xx responses parse the error envelope and surface its `code`
 *   instead of throwing a generic Error (audit P1-A #11).
 */
/**
 * Rotate the session token via POST /api/auth/refresh.
 *
 * Single-flight: concurrent callers share one network call, so
 * two triggers can never rotate twice back-to-back (the second
 * rotation used to revoke the token the first one had just
 * issued, and every request still carrying it died with a 401 —
 * the refresh race found during the P1 verification, 2026-11-16).
 *
 * Without `force`, the rotation only happens inside the last
 * 24h of the token's real life, read from the JWT exp claim
 * (falling back to the session's stored expiresAt). With
 * `force` (the apiFetch 401-retry path), the current token is
 * presumed dead and rotated unconditionally.
 *
 * Resolves true when the session now holds a fresh token.
 */
let refreshInFlight: Promise<boolean> | null = null;

function tokenExpiryMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function refreshSessionToken(force = false): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const sess = getSession();
  if (!sess?.token) return Promise.resolve(false);
  if (!force) {
    const expMs = tokenExpiryMs(sess.token) ?? sess.expiresAt;
    if (expMs - Date.now() > 24 * 60 * 60 * 1000) {
      return Promise.resolve(false);
    }
  }
  const presented = sess.token;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${presented}`,
        },
      });
      if (!res.ok) return false;
      const body = (await res.json().catch(() => null)) as {
        data?: { token?: unknown };
      } | null;
      const newToken = body?.data?.token;
      if (typeof newToken !== "string" || newToken === "") return false;
      const cur = getSession();
      if (!cur) return false;
      // The session moved on while we were rotating (a fresh
      // login, a logout): never stomp it with our result.
      if (cur.token !== presented && cur.token !== newToken) return false;
      setSession({
        ...cur,
        token: newToken,
        expiresAt: tokenExpiryMs(newToken) ?? cur.expiresAt,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return apiFetchOnce<T>(path, init, false);
}

async function apiFetchOnce<T>(
  path: string,
  init: RequestInit | undefined,
  retried: boolean
): Promise<T> {
  const isMultipart = init?.body instanceof FormData;
  // The login logic stores the JWT in the session (localStorage);
  // send it back as Bearer so protected endpoints accept the call.
  // On the server there is no session (no window), so the header is
  // omitted — public read endpoints must not require auth.
  const token = getSession()?.token;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...(isMultipart ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    });
  } catch (err) {
    // Network failure (backend down / refused): not an HTTP error.
    // Surface it as an ApiError so callers can fall back to mock.
    throw new ApiError(
      0,
      "network_error",
      `API request failed: network error (${path}): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!res.ok) {
    let code: string | undefined;
    let message = res.statusText;
    let parsedData: unknown;
    try {
      const parsed = (await res.json()) as {
        error?: { code?: string; message?: string };
        success?: boolean;
        message?: string;
        code?: string;
        data?: { suspended?: boolean } | null;
      };
      if (res.status === 403 && parsed.data?.suspended === true) {
        handleSuspendedKick(parsed.data);
      }
      code = parsed.error?.code ?? parsed.code;
      parsedData = parsed.data;
      // Backend error shape: { success: false, message, data: null }.
      message = parsed.error?.message ?? parsed.message ?? message;
    } catch {
      // Non-JSON error body (e.g. 502 HTML) — keep the generic message.
    }
    if (
      res.status === 401 &&
      !retried &&
      path !== "/api/auth/refresh" &&
      getSession() !== null
    ) {
      // A 401 with a live session usually means this request
      // carried a token a refresh had just rotated away. When
      // the session already holds a different token, retry
      // with it directly; only when the failed token is still
      // the current one is a (single-flight) rotation needed.
      const current = getSession()?.token ?? null;
      if (current !== null && current !== token) {
        return apiFetchOnce<T>(path, init, true);
      }
      const refreshed = await refreshSessionToken(true);
      if (refreshed) {
        return apiFetchOnce<T>(path, init, true);
      }
    }
    throw new ApiError(
      res.status,
      code,
      `API request failed: ${res.status} ${code ? `(${code}) ` : ""}${message} (${path})`,
      parsedData,
    );
  }

  const parsed = (await res.json()) as unknown;
  // Normalize the backend envelope { success, message, data } into the
  // contract envelope { data, meta } the callers expect. The backend's
  // `pagination` key (list endpoints) is copied through untouched so
  // paged callers can read it as `res.pagination`.
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "success" in parsed &&
    "data" in parsed
  ) {
    const envelope = parsed as {
      data: unknown;
      pagination?: ApiEnvelope<unknown>["pagination"];
    };
    return {
      data: envelope.data,
      ...(envelope.pagination !== undefined
        ? { pagination: envelope.pagination }
        : {}),
    } as T;
  }
  return parsed as T;
}