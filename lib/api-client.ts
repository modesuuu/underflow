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

/** Typed fetch against the backend. Throws on non-2xx. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(
      `API request failed: ${res.status} ${res.statusText} (${path})`
    );
  }

  return (await res.json()) as T;
}