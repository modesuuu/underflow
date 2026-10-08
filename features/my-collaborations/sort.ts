// features/my-collaborations/sort.ts
// Pure helper — no "use client", no side effects.

import { sortProjects } from "@/features/collaborations/sort";
import type { CollabSortKey } from "@/features/collaborations/types";
import type { MyCollabProject } from "./types";

/**
 * Sort MyCollabProject[] by the shared sort keys. `sortProjects` is typed on
 * the public `CollabProject` base; this wrapper keeps the `myStatus` field
 * through the pipeline (the base sort is structural-safe — same array in,
 * same array out — so the narrowing cast is exact, not a lie).
 */
export function sortMyProjects(
  projects: MyCollabProject[],
  sortKey: CollabSortKey
): MyCollabProject[] {
  return sortProjects(projects, sortKey) as MyCollabProject[];
}
