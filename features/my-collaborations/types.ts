import type { CollabProject } from "@/features/collaborations/types";

/**
 * The user's relationship status with a project. Deliberately a SEPARATE
 * domain from the public `ProjectStatus` (open | in-progress | completed) —
 * `myStatus` is the current user's own progress, not the project listing state.
 * (Board taxonomy, spec 2026-10-09.)
 */
export type MyCollabStatus = "not-started" | "pending" | "complete" | "revise";

/**
 * Category slug: the four work statuses plus "owned" — the
 * board's fourth column since 2026-11-13 (user order). Owned
 * is a RELATIONSHIP (the user owns the project), not a work
 * status, so it lives in the slug domain only; myStatus never
 * takes this value.
 */
export type MyCollabCategorySlug = MyCollabStatus | "owned";

export interface MyCollabProject extends CollabProject {
  myStatus: MyCollabStatus;
}

export interface MyCollabCategory {
  slug: MyCollabCategorySlug;
  /** Column heading on the board, e.g. "My collaborations". */
  boardLabel: string;
  /** Breadcrumb / category-page heading, e.g. "Active". */
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
    crumbLabel: "Active",
    pillClassName: "bg-bg text-ink",
    subtitle: "Your active projects.",
    icon: "group",
  },
  {
    slug: "pending",
    boardLabel: "Pending",
    crumbLabel: "Pending",
    pillClassName: "bg-ink text-surface",
    subtitle: "Waiting for review.",
    icon: "loader-circle",
  },
  {
    slug: "complete",
    boardLabel: "Complete",
    crumbLabel: "Complete",
    pillClassName: "bg-accent text-on-accent",
    subtitle: "Finished and wrapped up.",
    icon: "check-circle",
  },
  {
    slug: "revise",
    boardLabel: "Revise",
    crumbLabel: "Revise",
    pillClassName: "bg-badge text-white",
    subtitle: "Needs another pass.",
    icon: "revision",
  },
  {
    slug: "owned",
    boardLabel: "Owned",
    crumbLabel: "Owned",
    pillClassName: "bg-bg text-ink",
    subtitle: "Projects you own.",
    icon: "crown",
  },
];

export function getCategory(slug: string): MyCollabCategory | undefined {
  return MY_COLLAB_CATEGORIES.find((c) => c.slug === slug);
}
