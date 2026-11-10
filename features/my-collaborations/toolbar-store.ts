import { useSyncExternalStore } from "react";

/**
 * Session-scoped search state for /my-collaborations — the same
 * module-store pattern as the collaborations toolbar store. The
 * search pill lives in the TopBar (AppShell `actions`, user order
 * 2026-11-10) while the Kanban board that consumes it lives in
 * the page body, so the two share this store instead of
 * prop-drilling through the server page. State dies on refresh;
 * MyCollabBoard resets it on unmount so each visit starts fresh.
 *
 * Unlike the collaborations store, this one holds a single live
 * `query` (no draft/commit split): the board filters as you
 * type, which is how the search behaved when it lived in the
 * board header, and there is no sort dropdown to commit with.
 */

export interface MyCollabToolbarState {
  query: string;
}

const DEFAULTS: MyCollabToolbarState = {
  query: "",
};

let state: MyCollabToolbarState = { ...DEFAULTS };
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

function getSnapshot(): MyCollabToolbarState {
  return state;
}

export function useMyCollabToolbar(): MyCollabToolbarState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setQuery(query: string) {
  if (state.query === query) return;
  state = { ...state, query };
  emit();
}

export function clearToolbar() {
  state = { ...DEFAULTS };
  emit();
}
