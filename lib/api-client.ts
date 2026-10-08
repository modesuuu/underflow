/**
 * Single gateway to the backend. Feature modules call this through their
 * own <feature>/api.ts; components never call fetch directly.
 *
 * NEXT_PUBLIC_API_URL empty -> features fall back to their mock.ts data.
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  ""
);

/** True when a real backend base URL is configured. */
export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
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

  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Typed fetch against the backend. Throws ApiError on non-2xx.
 * - FormData bodies skip the JSON Content-Type header so the browser sets
 *   the multipart boundary itself (audit P1-A #10).
 * - Non-2xx responses parse the error envelope and surface its `code`
 *   instead of throwing a generic Error (audit P1-A #11).
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const isMultipart = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: isMultipart
      ? { ...(init?.headers ?? {}) }
      : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    let code: string | undefined;
    let message = res.statusText;
    try {
      const parsed = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      code = parsed.error?.code;
      message = parsed.error?.message ?? message;
    } catch {
      // Non-JSON error body (e.g. 502 HTML) — keep the generic message.
    }
    throw new ApiError(
      res.status,
      code,
      `API request failed: ${res.status} ${code ? `(${code}) ` : ""}${message} (${path})`
    );
  }

  return (await res.json()) as T;
}