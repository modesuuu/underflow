import type { MyCollabCategorySlug, MyCollabProject } from "./types";

/**
 * Board column model (user order 2026-11-13): the board's
 * fourth column is Owned — every project the user owns —
 * replacing the Revise column. The columns PARTITION the
 * project list: a project appears in exactly one column.
 * Owned wins over status; projects the user joined fall back
 * to their status column, and a member-side "revise" lands in
 * Active (the revise state itself is untouched — it still
 * drives the detail page, its route, and its Revision bar).
 * Jev chose Partition over Duplication (92%, conf 0.84).
 */
export const BOARD_COLUMN_ORDER: MyCollabCategorySlug[] = [
  "not-started",
  "pending",
  "complete",
  "owned",
];

export interface MyCollabColumn {
  slug: MyCollabCategorySlug;
  projects: MyCollabProject[];
  /** Global card-tint offset: sum of the earlier columns'
      counts, so a project keeps its tint on its category page. */
  startIndex: number;
}

function isOwned(p: MyCollabProject, myUserId: string | null): boolean {
  return myUserId !== null && p.owner.id === myUserId;
}

/** Partition a project list into the board's four columns. */
export function groupMyCollabBoard(
  projects: MyCollabProject[],
  myUserId: string | null
): MyCollabColumn[] {
  const lists: Record<string, MyCollabProject[]> = {
    "not-started": [],
    pending: [],
    complete: [],
    owned: [],
  };
  for (const p of projects) {
    if (isOwned(p, myUserId)) lists.owned.push(p);
    else if (p.myStatus === "pending") lists.pending.push(p);
    else if (p.myStatus === "complete") lists.complete.push(p);
    else lists["not-started"].push(p); // not-started + revise
  }
  let offset = 0;
  return BOARD_COLUMN_ORDER.map((slug) => {
    const col: MyCollabColumn = {
      slug,
      projects: lists[slug],
      startIndex: offset,
    };
    offset += lists[slug].length;
    return col;
  });
}

/**
 * One category page's slice. Board categories reuse the board
 * grouping (same lists, same tint offsets). The Revise page
 * is not a board column anymore: it keeps listing every
 * project whose myStatus is revise (its original meaning),
 * starting from the Active column's tint offset.
 */
export function myCollabCategorySlice(
  projects: MyCollabProject[],
  myUserId: string | null,
  slug: MyCollabCategorySlug
): { projects: MyCollabProject[]; startIndex: number } {
  if (slug === "revise") {
    return {
      projects: projects.filter((p) => p.myStatus === "revise"),
      startIndex: 0,
    };
  }
  const col = groupMyCollabBoard(projects, myUserId).find(
    (c) => c.slug === slug
  );
  return { projects: col?.projects ?? [], startIndex: col?.startIndex ?? 0 };
}
