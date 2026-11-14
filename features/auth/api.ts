import { ApiError, apiFetch, getApiBaseUrl, type ApiEnvelope } from "@/lib/api-client";
import { getSession, setSession } from "./session";
import type { AuthSession, AuthUser, LoginInput, RegisterInput } from "./types";
import { firstError, validateLogin, validateRegister } from "./validation";

/**
 * Auth API. Backend-only: login/register call the real endpoints
 * (POST /api/auth/login|register). The backend answers
 * `{ success, message, data }`; the envelope adapter below normalizes
 * it. Login is username-only, register returns no token (the client
 * signs in afterwards), the token lives 3 days.
 */

/** 3 days, in ms — mirrors the backend JWT expiry (utils/JWT.php: 259200s). */
export const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;

/** Status banding atas suspend aktif, dari payload login 403 (§4.4). */
export interface SuspendedAppealInfo {
  status: "pending" | "granted" | "denied";
  decisionNote: string | null;
  createdAt: string;
}

export interface SuspendedInfo {
  reason: string | null;
  suspendedAt: string | null;
  appeal: SuspendedAppealInfo | null;
}

/**
 * Dilempar alih-alih ApiError generik saat login ditolak karena akun
 * disuspend, supaya layar login bisa menampilkan alasan + form
 * banding. googleIdToken dibawa untuk akun Google: kredensial yang
 * barusan terverifikasi adalah verifikasi untuk bandingnya.
 */
export class SuspendedAccountError extends ApiError {
  readonly suspended: SuspendedInfo;
  readonly googleIdToken?: string;

  constructor(info: SuspendedInfo, googleIdToken?: string) {
    super(403, "account_suspended", "Akun kamu sedang disuspend.");
    this.name = "SuspendedAccountError";
    this.suspended = info;
    this.googleIdToken = googleIdToken;
  }
}

interface SuspendedPayload {
  suspended?: boolean;
  reason?: string | null;
  suspended_at?: string | null;
  appeal?: {
    status: "pending" | "granted" | "denied";
    decision_note: string | null;
    created_at: string;
  } | null;
}

/** Map a raw suspended payload (login 403 / middleware 403) into
 *  the notice shape; null when the payload is not a suspension. */
export function mapSuspendedInfo(data: unknown): SuspendedInfo | null {
  const d = data as SuspendedPayload | null;
  if (!d?.suspended) return null;
  return {
    reason: d.reason ?? null,
    suspendedAt: d.suspended_at ?? null,
    appeal: d.appeal
      ? {
          status: d.appeal.status,
          decisionNote: d.appeal.decision_note,
          createdAt: d.appeal.created_at,
        }
      : null,
  };
}

function throwIfSuspended(data: unknown, googleIdToken?: string): void {
  const info = mapSuspendedInfo(data);
  if (!info) return;
  throw new SuspendedAccountError(info, googleIdToken);
}


function toAuthUser(record: {
  id: string;
  username: string;
  email?: string | null;
  photo_profile_url?: string | null;
  role?: string | null;
}): AuthUser {
  return {
    id: record.id,
    username: record.username,
    email: record.email ?? "",
    name: record.username,
    photo: record.photo_profile_url ?? undefined,
    role: (record.role ?? "user") as AuthUser["role"],
    provider: "password",
  };
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const errors = validateLogin(input);
  if (Object.keys(errors).length > 0) {
    throw new ApiError(
      400,
      "validation_error",
      firstError(errors) ?? "Check the form and try again.",
    );
  }
  return loginViaBackend(input);
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const errors = validateRegister(input);
  if (Object.keys(errors).length > 0) {
    throw new ApiError(
      400,
      "validation_error",
      firstError(errors) ?? "Check the form and try again.",
    );
  }
  return registerViaBackend(input);
}

/** Minimal typing for the Google Identity Services (GIS) global. */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: (
            cb?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void,
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let gisLoadPromise: Promise<void> | null = null;

/** Load the Google Identity Services script once (client-side only). */
function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new ApiError(500, "validation_error", "Google sign-in needs a browser."));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new ApiError(500, "validation_error", "Could not load Google sign-in."));
    };
    script.onerror = () =>
      reject(new ApiError(500, "validation_error", "Could not load Google sign-in."));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

/**
 * Real Google sign-in (Google Identity Services, ID-token flow).
 * Opens Google's account chooser, sends the ID token to
 * POST /api/auth/google, and stores the returned JWT as the session
 * (provider "google"). No mock, no demo account.
 */
export async function signInWithGoogle(): Promise<AuthSession> {
  if (GOOGLE_CLIENT_ID === "") {
    throw new ApiError(
      500,
      "validation_error",
      "Google sign-in is not configured yet (missing client ID).",
    );
  }
  await loadGoogleIdentityScript();
  const google = window.google?.accounts?.id;
  if (!google) {
    throw new ApiError(500, "validation_error", "Could not load Google sign-in.");
  }

  // Ask Google for an ID token (One Tap / account chooser).
  const idToken = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new ApiError(500, "validation_error", "Google sign-in timed out."));
      }
    }, 60000);
    google.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      callback: (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (response.credential) resolve(response.credential);
        else reject(new ApiError(500, "validation_error", "Google did not return a credential."));
      },
    });
    google.prompt((notification) => {
      // The user closed the chooser without picking an account.
      if (settled) return;
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        settled = true;
        clearTimeout(timer);
        reject(new ApiError(0, "google_cancelled", "Google sign-in was cancelled."));
      }
    });
  });

  // Exchange the ID token for our JWT.
  const res = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  const body = await readBackendEnvelope<{
    id: string;
    username: string;
    token: string;
    email?: string | null;
  }>(res);
  throwIfSuspended(body.data, idToken);
  if (!res.ok || !body.success || !body.data?.token) {
    throw new ApiError(res.status, "invalid_credentials", body.message || "Google sign-in failed.");
  }
  const session: AuthSession = {
    user: { ...toAuthUser(body.data), provider: "google" },
    token: body.data.token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  setSession(session);
  return session;
}

export async function getMe(): Promise<AuthUser | null> {
  const current = getSession();
  if (!current) return null;
  if (current.expiresAt <= Date.now()) {
    setSession(null);
    return null;
  }
  return current.user;
}

/**
 * Signs out on the server too (audit P0, 2026-11-14): the backend
 * revokes the token so it cannot be replayed, then the local
 * session is discarded either way — a failed revoke call must
 * never trap the user in a signed-in UI.
 */
export async function logout(): Promise<void> {
  const token = getSession()?.token;
  if (token) {
    try {
      await fetch(getApiBaseUrl() + "/api/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
    } catch {
      // Best effort: the local sign-out proceeds regardless.
    }
  }
  setSession(null);
}

/** Changes the signed-in user's password (PUT /api/auth/change-password). */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<ApiEnvelope<null>>("/api/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

/* --- Backend path --- */

interface BackendEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

async function readBackendEnvelope<T>(res: Response): Promise<BackendEnvelope<T>> {
  try {
    return (await res.json()) as BackendEnvelope<T>;
  } catch {
    return { success: false, message: res.statusText, data: null };
  }
}

async function loginViaBackend(input: LoginInput): Promise<AuthSession> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: input.username.trim(), password: input.password }),
  });
  const body = await readBackendEnvelope<{
    id: string;
    username: string;
    token: string;
    email?: string | null;
  }>(res);
  throwIfSuspended(body.data);
  if (res.status === 429) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Try again in a few minutes.");
  }
  if (!res.ok || !body.success || !body.data?.token) {
    // Deliberately generic (user rule 2026-11-12): the backend now
    // answers one generic 401 for unknown user and wrong password
    // alike (audit P0), and the UI keeps the same generic wording.
    throw new ApiError(res.status, "invalid_credentials", "Username/password salah");
  }
  const session: AuthSession = {
    user: toAuthUser(body.data),
    token: body.data.token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  setSession(session);
  return session;
}

async function registerViaBackend(input: RegisterInput): Promise<AuthSession> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username.trim(),
      email: input.email.trim(),
      password: input.password,
    }),
  });
  const body = await readBackendEnvelope<{ id: string; username: string }>(res);
  if (res.status === 429) {
    throw new ApiError(429, "rate_limited", "Too many attempts. Try again in a few minutes.");
  }
  if (!res.ok || !body.success) {
    // The backend answers 400 for every register failure, so the
    // duplicates are recognized by message and mapped to the field
    // they belong to (the form renders them inline + as a toast).
    const message = body.message || "";
    if (message.includes("Username tersebut telah terdaftar")) {
      throw new ApiError(res.status, "username_taken", "That username is already taken.");
    }
    if (message.includes("Email tersebut telah terdaftar")) {
      throw new ApiError(res.status, "email_taken", "That email is already registered.");
    }
    throw new ApiError(
      res.status,
      "validation_error",
      message || "Could not create the account.",
    );
  }
  return loginViaBackend({ username: input.username, password: input.password });
}
