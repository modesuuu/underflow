"use client";

// features/circle/circles.ts
// The circle list as shared client state — the same idiom as the
// planner boards store: the Sidebar reads it for the Circle
// submenu, the workspace writes it on fetch / create / delete
// and on live unread bumps, so both stay in sync without
// refetching. null = not loaded yet.

import { useSyncExternalStore } from "react";
import { getCircles } from "./api";
import type { CircleSummary } from "./types";

let circles: CircleSummary[] | null = null;
let inflight: Promise<CircleSummary[]> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (circles === null) void refreshCircles();
  return () => {
    listeners.delete(listener);
  };
}

export function useCircles(): CircleSummary[] | null {
  return useSyncExternalStore(subscribe, () => circles, () => null);
}

/** Current list without subscribing (the delete flow picks the next circle). */
export function getCirclesSnapshot(): CircleSummary[] | null {
  return circles;
}

/**
 * Fetch GET /api/circles once; concurrent callers share the
 * flight. Never throws — on failure the list is empty and the
 * next subscribe retries.
 */
export async function refreshCircles(): Promise<CircleSummary[]> {
  if (inflight) return inflight;
  inflight = getCircles()
    .then((rows) => {
      circles = rows;
      emit();
      return rows;
    })
    .catch(() => {
      circles = [];
      emit();
      return circles;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function setCircles(rows: CircleSummary[]): void {
  circles = rows;
  emit();
}

export function updateCircle(
  id: string,
  update: (c: CircleSummary) => CircleSummary
): void {
  if (!circles) return;
  circles = circles.map((c) => (c.id === id ? update(c) : c));
  emit();
}

export function patchCircle(
  id: string,
  patch: Partial<CircleSummary>
): void {
  updateCircle(id, (c) => ({ ...c, ...patch }));
}

export function removeCircle(id: string): void {
  if (!circles) return;
  circles = circles.filter((c) => c.id !== id);
  emit();
}

// ---- Create-circle dialog visibility -----------------------
// Opened from the sidebar's New circle row; the dialog itself is
// rendered once by the workspace (it owns the project list).

let createOpen = false;
const createListeners = new Set<() => void>();

export function setCreateCircleOpen(next: boolean): void {
  if (createOpen === next) return;
  createOpen = next;
  createListeners.forEach((listener) => listener());
}

export function useCreateCircleOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      createListeners.add(listener);
      return () => {
        createListeners.delete(listener);
      };
    },
    () => createOpen,
    () => false
  );
}
