"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { clearToolbar, useMyCollabToolbar } from "../toolbar-store";
import { KanbanCard } from "./KanbanCard";
import {
  MY_COLLAB_CATEGORIES,
  getCategory,
} from "../types";
import type { MyCollabCategory, MyCollabProject, MyCollabStatus } from "../types";

/**
 * Dashboard order for the columns: the category-table order
 * (Not Started, Pending, Complete, Revise).
 */
export const STATS_ORDER: MyCollabStatus[] = [
  "not-started",
  "pending",
  "complete",
  "revise",
];

interface MyCollabBoardProps {
  projects: MyCollabProject[];
}

/**
 * The user's project board, redesigned 2026-11-10 as a weihu-style
 * Kanban (user order: "redesign lagi kaya gini", "harus bener-bener
 * mirip"). Four columns by status; the status chips are gone
 * because the columns ARE the filter, and the header stats are
 * gone because each column header shows its count and links to
 * its category page. The search pill moved to the TopBar (user
 * order 2026-11-10) and filters cards across all columns via
 * the shared toolbar store. New Project stays off this board by
 * 2026-11-09 removal order, so the columns carry no "+" button
 * and no kebab — no dead controls. A column header chevron
 * collapses that column. The scoop + arc from the 2026-11-10
 * card-shape rounds are retired: weihu cards are plain rounded
 * rectangles, and the redesign follows the reference.
 */
/** How many cards a column previews before the View more button. */
const PREVIEW_LIMIT = 4;

export function MyCollabBoard({ projects }: MyCollabBoardProps) {
  const { query } = useMyCollabToolbar();

  // Reset the shared search on unmount so each visit starts
  // fresh (same pattern as the collaborations grid).
  useEffect(() => () => clearToolbar(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [projects, query]);


  const clearSearch = clearToolbar;

  const bySlug = new Map<MyCollabStatus, MyCollabCategory>(
    MY_COLLAB_CATEGORIES.map((c) => [c.slug, c])
  );

  // Columns with a global pastel offset, so the 5 tints cycle across
  // the whole board. (Per-column indexing never reaches the 5th
  // tint — the largest column has 4 cards.)
  let pastelOffset = 0;
  const columns = STATS_ORDER.map((slug) => {
    const cat = bySlug.get(slug);
    const list = filtered.filter((p) => p.myStatus === slug);
    const col = {
      slug,
      cat,
      projects: list,
      startIndex: pastelOffset,
    };
    pastelOffset += list.length;
    return col;
  }).filter(
    (c): c is {
      slug: MyCollabStatus;
      cat: MyCollabCategory;
      projects: MyCollabProject[];
      startIndex: number;
    } => c.cat !== undefined
  );

  const totalCount = projects.length;
  const statusCount = STATS_ORDER.filter(
    (slug) => projects.some((p) => p.myStatus === slug)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header — title + subtitle. The search pill moved to the
          TopBar (user order 2026-11-10); no stats, no chips: the
          columns carry the counts and the status filter. */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[40px] leading-none font-semibold tracking-tight text-ink uppercase">
          My Collaborations
        </h1>
        <p className="text-sm text-muted">
          {totalCount} projects · {statusCount} statuses
          {query.trim() !== "" &&
            ` · ${filtered.length} matching "${query.trim()}"`}
        </p>
      </div>

      {/* Kanban — one column per status. Columns stack on phones,
          two-up on tablets, four-up on desktop. */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-bg px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface">
            <Icon name="search" size={20} className="text-muted" />
          </span>
          <p className="text-base font-semibold text-ink">
            No projects match
          </p>
          <p className="max-w-sm text-sm text-muted">
            No projects match your search. Clear it to see all
            projects.
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="pressable mt-2 cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-line">
          {columns.map(({ slug, cat, projects: columnProjects, startIndex }) => {
            return (
              <section
                key={slug}
                aria-label={cat.crumbLabel}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <div className="flex items-center gap-1.5 px-1 pt-1">

                  <Link
                    href={`/my-collaborations/${slug}`}
                    className="text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    {cat.crumbLabel}
                  </Link>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-semibold text-muted tabular-nums">
                    {columnProjects.length}
                  </span>
                </div>
                  <div className="flex flex-col gap-3">
                    {columnProjects.length === 0 ? (
                      <p className="px-1 py-3 text-center text-[13px] text-muted">
                        No projects match in this status.
                      </p>
                    ) : (
                      columnProjects.slice(0, PREVIEW_LIMIT).map((p, i) => (
                        <KanbanCard
                          key={p.id}
                          project={p}
                          index={startIndex + i}
                        />
                      ))
                    )}
                    {columnProjects.length > 0 && (
                      <Link
                        href={`/my-collaborations/${slug}`}
                        className="flex h-10 items-center justify-center gap-1 rounded-xl bg-bg text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        {columnProjects.length > PREVIEW_LIMIT
                          ? `View ${columnProjects.length - PREVIEW_LIMIT} more`
                          : "View more"}
                        <Icon name="chevron-down" size={16} />
                      </Link>
                    )}
                  </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
