import { useSyncExternalStore } from "react";
import type { CollabSortKey } from "./types";

/**
 * Session-scoped toolbar state for /collaborations — the same
 * module-store pattern as the inbox store. The search pill lives
 * in the TopBar (AppShell `actions`, user order 2026-11-09)
 * while the grid that consumes it lives in the page body, so the
 * two share this store instead of prop-drilling through the
 * server page. State dies on refresh; CollabGrid resets it on
 * unmount so each visit starts fresh, as before.
 *
 * 2026-11-09: the sort (Recommended) and status filter were
 * deleted with their buttons; the type filter replaced them
 * inside the pill. Later the same day the user swapped the
 * pill's dropdown back to the sort — the store now holds the
 * search query and the sort key only.
 */

export interface CollabToolbarState {
  draftQuery: string;
  query: string;
  sortKey: CollabSortKey;
}

const DEFAULTS: CollabToolbarState = {
  draftQuery: "",
  query: "",
  sortKey: "recommended",
};

let state: CollabToolbarState = { ...DEFAULTS };
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

function getSnapshot(): CollabToolbarState {
  return state;
}

export function useCollabToolbar(): CollabToolbarState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setDraftQuery(draftQuery: string) {
  if (state.draftQuery === draftQuery) return;
  state = { ...state, draftQuery };
  emit();
}

/** Commit the draft — Enter (the pill has no Search button). */
export function commitSearch() {
  if (state.query === state.draftQuery) return;
  state = { ...state, query: state.draftQuery };
  emit();
}

export function setSortKey(sortKey: CollabSortKey) {
  if (state.sortKey === sortKey) return;
  state = { ...state, sortKey };
  emit();
}

/** One-click reset (the "Clear search & filters" button). */
export function clearToolbar() {
  state = { ...DEFAULTS };
  emit();
}

export function hasActiveFilters(s: CollabToolbarState): boolean {
  return s.query.trim() !== "" || s.sortKey !== "recommended";
}
