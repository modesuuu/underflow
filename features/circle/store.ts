"use client";

import { useSyncExternalStore } from "react";

/**
 * Circle right-panel visibility (client-only UI state). null = follow
 * the viewport default (open at >=1280px); a boolean is the user's
 * override from the header toggle. Data fetching lives in the loaders;
 * this store holds no data.
 */
let panelOpen: boolean | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPanelOpen(open: boolean): void {
  panelOpen = open;
  listeners.forEach((listener) => listener());
}

export function usePanelState(): { open: boolean | null } {
  const open = useSyncExternalStore(
    subscribe,
    () => panelOpen,
    () => null
  );
  return { open };
}
