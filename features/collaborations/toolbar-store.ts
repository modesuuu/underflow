import { useSyncExternalStore } from "react";
import type { CollabFilterType } from "./types";

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
 * deleted with their buttons — the store now holds only the
 * search query and the type filter (the pill's dropdown).
 */

export interface CollabToolbarState {
  draftQuery: string;
  query: string;
  typeFilter: CollabFilterType;
}

const DEFAULTS: CollabToolbarState = {
  draftQuery: "",
  query: "",
  typeFilter: "all",
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

export function setTypeFilter(typeFilter: CollabFilterType) {
  if (state.typeFilter === typeFilter) return;
  state = { ...state, typeFilter };
  emit();
}

/** One-click reset (the "Clear search & filters" button). */
export function clearToolbar() {
  state = { ...DEFAULTS };
  emit();
}

export function hasActiveFilters(s: CollabToolbarState): boolean {
  return s.query.trim() !== "" || s.typeFilter !== "all";
}
