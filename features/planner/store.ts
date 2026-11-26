"use client";

// features/planner/store.ts
// Two small bridges, same idiom as the inbox/circle stores:
//  1. Sidebar badge: my open-task count, refreshed on subscribe and
//     then every 60s while anyone is subscribed.
//  2. Realtime fan-out: LivePoller owns the WebSocket and forwards
//     "planner-task" pushes here; open planner panels subscribe for
//     their collab and refetch.

import { useSyncExternalStore } from "react";
import { getSessionUser } from "@/features/auth/session";
import { getMyTasks } from "./api";
import type { PlannerTask } from "./types";

// ── Badge count ─────────────────────────────────────────────────────

let openCount = 0;
let badgeStarted = false;
const badgeListeners = new Set<() => void>();

function emitBadge(): void {
  badgeListeners.forEach((listener) => listener());
}

export async function refreshMyTaskCount(): Promise<void> {
  if (!getSessionUser()) {
    if (openCount !== 0) {
      openCount = 0;
      emitBadge();
    }
    return;
  }
  try {
    const data = await getMyTasks();
    const next = data?.counts.open ?? 0;
    if (next !== openCount) {
      openCount = next;
      emitBadge();
    }
  } catch {
    // Backend unreachable: keep the last known count.
  }
}

function subscribeBadge(listener: () => void): () => void {
  badgeListeners.add(listener);
  if (!badgeStarted) {
    badgeStarted = true;
    void refreshMyTaskCount();
    window.setInterval(() => void refreshMyTaskCount(), 60_000);
  }
  return () => {
    badgeListeners.delete(listener);
  };
}

export function useMyTaskOpenCount(): number {
  return useSyncExternalStore(
    subscribeBadge,
    () => openCount,
    () => 0
  );
}

// ── Realtime fan-out ────────────────────────────────────────────────

export interface PlannerTaskEvent {
  collabId: string;
  task: PlannerTask | { id: string; deleted: true };
}

const taskListeners = new Set<(event: PlannerTaskEvent) => void>();

export function subscribePlannerTasks(
  listener: (event: PlannerTaskEvent) => void
): () => void {
  taskListeners.add(listener);
  return () => {
    taskListeners.delete(listener);
  };
}

export function applyRealtimePlannerTask(event: PlannerTaskEvent): void {
  taskListeners.forEach((listener) => listener(event));
}
