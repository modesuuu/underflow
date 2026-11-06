import { useSyncExternalStore } from "react";
import type { AuthSession, AuthUser } from "./types";
import type { MockUser } from "./mock";
import { MOCK_USERS } from "./mock";

/**
 * Session store — the same external-store idiom as the notifications
 * store: one module singleton, `useSyncExternalStore` for reads, exported
 * actions for writes, nothing else touches localStorage.
 *
 * Storage mirrors the real backend's transport (Jev 0.99, 2026-11-06):
 * the token is returned in the response body and kept in localStorage,
 * sent back as `Authorization: Bearer <token>`. No cookie, so Next.js
 * middleware cannot guard routes — the guard is the client-side AuthGate.
 */
const SESSION_KEY = "uf-auth-session";
const REGISTERED_USERS_KEY = "uf-auth-users";

let session: AuthSession | null = null;
let restored = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
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

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSessionUser() !== null,
    () => false,
  );
}

export function useSessionUser(): AuthUser | null {
  return useSyncExternalStore(subscribe, () => getSessionUser(), () => null);
}

/** Lets other stores react to login/logout (e.g. the Circle store patches the "me" member name). */
export function subscribeAuth(listener: () => void): () => void {
  return subscribe(listener);
}

/** All accounts the mock knows: seeds plus accounts registered in this browser. */
export function listUsers(): MockUser[] {
  if (typeof window === "undefined") return [...MOCK_USERS];
  try {
    const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
    const registered = raw ? (JSON.parse(raw) as MockUser[]) : [];
    return [...MOCK_USERS, ...registered];
  } catch {
    return [...MOCK_USERS];
  }
}

export function addRegisteredUser(user: MockUser): void {
  if (typeof window === "undefined") return;
  const registered = listUsers().filter(
    (u) => !MOCK_USERS.some((s) => s.username === u.username),
  );
  registered.push(user);
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
}
