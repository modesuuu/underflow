import type { AuthSession, AuthUser } from "./types";

/**
 * Plain session state: storage, the in-memory session, and the listener
 * set. No React import on purpose — this module is imported by
 * server-component chains too (nav.ts -> profile/mock.ts), where client
 * hooks are forbidden. The React hooks live in store.ts, a thin layer
 * over this file.
 *
 * Storage mirrors the real backend's transport (Jev 0.99, 2026-11-06):
 * the token is returned in the response body and kept in localStorage,
 * sent back as `Authorization: Bearer <token>`. No cookie, so Next.js
 * middleware cannot guard routes — the guard is the client-side AuthGate.
 */
const SESSION_KEY = "uf-auth-session";

let session: AuthSession | null = null;
let restored = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the persisted session once (client only). Expired sessions are discarded. */
export function restoreSession(): void {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.user?.id || !parsed.token || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }
    session = parsed;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): AuthSession | null {
  restoreSession();
  return session;
}

export function getSessionUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function setSession(next: AuthSession | null): void {
  session = next;
  if (typeof window !== "undefined") {
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  }
  emit();
}

