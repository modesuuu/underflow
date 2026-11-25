"use client";

// features/planner/collab-status.ts
// The live status of the collaborations the user owns, shared
// by the board system: the sidebar hides team boards whose
// collab is completed, the board page shows a finished notice
// for them, and the create dialog only offers collabs that
// are still running. The list comes from GET
// /api/my-collaborations (same rule as the My Collaborations
// Owned column: owner.id === the session user) and refreshes
// every 60s while anyone is subscribed, mirroring the
// sidebar task-count badge — so a collab completed or
// reopened elsewhere brings its board back without a reload.

import { useSyncExternalStore } from "react";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { getSessionUser } from "@/features/auth/session";

export interface OwnedCollabInfo {
  id: string;
  title: string;
  status: "open" | "in-progress" | "completed";
}

export interface OwnedCollabsSnapshot {
  /** null while the first fetch is still in flight. */
  list: OwnedCollabInfo[] | null;
  failed: boolean;
}

const SERVER_SNAPSHOT: OwnedCollabsSnapshot = { list: null, failed: false };
let snapshot: OwnedCollabsSnapshot = SERVER_SNAPSHOT;
let started = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export async function refreshOwnedCollabs(): Promise<void> {
  const me = getSessionUser()?.id ?? null;
  try {
    const projects = await getMyCollabProjects();
    snapshot = {
      list: projects
        .filter((p) => me !== null && p.owner.id === me)
        .map((p) => ({ id: p.id, title: p.title, status: p.status })),
      failed: false,
    };
  } catch {
    snapshot = { list: snapshot.list, failed: true };
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    void refreshOwnedCollabs();
    window.setInterval(() => void refreshOwnedCollabs(), 60_000);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useOwnedCollabs(): OwnedCollabsSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

/** True when the collab behind a team board is finished, so
 * its board must be hidden until the collab is reopened. A
 * missing entry (not loaded yet, or the collab is gone) never
 * hides a board. */
export function isCollabCompleted(
  list: OwnedCollabInfo[] | null,
  collabId?: string,
  collabName?: string,
): boolean {
  if (!list) return false;
  return list.some(
    (c) =>
      c.status === "completed" &&
      ((collabId !== undefined && c.id === collabId) ||
        (collabName !== undefined && c.title === collabName)),
  );
}
