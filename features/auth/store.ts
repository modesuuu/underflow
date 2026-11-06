"use client";

import { useSyncExternalStore } from "react";
import { getSessionUser, subscribe } from "./session";
import type { AuthUser } from "./types";

/**
 * React layer over session.ts: the hooks components use. Kept separate
 * because useSyncExternalStore cannot be imported into a Server Component,
 * and session.ts is imported by server chains (via nav.ts).
 */
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
