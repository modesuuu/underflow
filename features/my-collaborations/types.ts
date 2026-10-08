import type { CollabProject } from "@/features/collaborations/types";

/**
 * The user's relationship status with a project. Deliberately a SEPARATE
 * domain from the public `ProjectStatus` (open | in-progress | completed) —
 * `myStatus` is the current user's own progress, not the project listing state.
 * (Board taxonomy, spec 2026-10-09.)
 */
export type MyCollabStatus = "not-started" | "pending" | "complete" | "revise";

export interface MyCollabProject extends CollabProject {
  myStatus: MyCollabStatus;
}

export interface MyCollabCategory {
  slug: MyCollabStatus;
  /** Column heading on the board, e.g. "My collaborations". */
  boardLabel: string;
  /** Breadcrumb / category-page heading, e.g. "Not Started". */
  crumbLabel: string;
  /** Pill colour class on the board header. */
  pillClassName: string;
  /** Category page subtitle. */
  subtitle: string;
  /** Boxicons name (bx- prefix) for the board column pill. */
  icon: string;
}

/**
 * Canonical category table (spec decision #2). Pill backgrounds are pale
 * neutrals matching the design; the `not-started` subtitle is from the frame,
 * the other three follow the same tone. Icons: `zap` is not in boxicons —
 * `revision` (draft pen) is the closest available glyph for Revise.
 */
export const MY_COLLAB_CATEGORIES: MyCollabCategory[] = [
  {
    slug: "not-started",
    boardLabel: "My collaborations",
    crumbLabel: "Not Started",
    pillClassName: "bg-bg text-ink",
    subtitle: "Queued and ready to start.",
    icon: "group",
  },
  {
    slug: "pending",
    boardLabel: "Pending",
    crumbLabel: "Pending",
    pillClassName: "bg-badge/10 text-badge",
    subtitle: "Waiting for review.",
    icon: "loader-circle",
  },
  {
    slug: "complete",
    boardLabel: "Complete",
    crumbLabel: "Complete",
    pillClassName: "bg-accent/40 text-ink",
    subtitle: "Finished and wrapped up.",
    icon: "check-circle",
  },
  {
    slug: "revise",
    boardLabel: "Revise",
    crumbLabel: "Revise",
    pillClassName: "bg-accent/20 text-ink",
    subtitle: "Needs another pass.",
    icon: "revision",
  },
];

export function getCategory(slug: string): MyCollabCategory | undefined {
  return MY_COLLAB_CATEGORIES.find((c) => c.slug === slug);
}
