"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate, parseDueDate } from "@/features/collaborations/sort";
import { clearToolbar, useMyCollabToolbar } from "../toolbar-store";
import {
  MY_COLLAB_CATEGORIES,
  getCategory,
} from "../types";
import type { MyCollabCategory, MyCollabProject, MyCollabStatus } from "../types";

/**
 * Dashboard order for the columns: the category-table order
 * (Not Started, Pending, Complete, Revise).
 */
const STATS_ORDER: MyCollabStatus[] = [
  "not-started",
  "pending",
  "complete",
  "revise",
];

/**
 * Weihu pastel rotation for the cards. One tint per card, cycling
 * by index inside its column, so a column shows varied pastels
 * the way the reference does. Plain CSS classes (globals.css) —
 * not Tailwind arbitrary values — so the tints are exact in the
 * served CSS and carry a dark-mode override each.
 */
const PASTEL_CLASSES = [
  "kanban-pastel-blue",
  "kanban-pastel-purple",
  "kanban-pastel-pink",
  "kanban-pastel-peach",
  "kanban-pastel-mint",
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One project card for the Kanban board — the weihu card,
 * translated to our data: skill tags on top, title + subtitle,
 * a dotted seat meter (the reference's Progress slot), and a
 * footer of owner avatar + due date. The whole card is the
 * link; there is no inner button and no status pill (the column
 * is the status). No scoop: weihu cards are plain rounded
 * rectangles, and the redesign follows the reference.
 */
function KanbanCard({
  project,
  index,
}: {
  project: MyCollabProject;
  index: number;
}) {
  const dueMs = parseDueDate(project.dueDate);
  const daysLeft =
    dueMs === Infinity
      ? null
      : Math.ceil((dueMs - Date.now()) / DAY_MS);
  const urgent =
    project.myStatus !== "complete" && daysLeft !== null && daysLeft <= 7;
  const pastel = PASTEL_CLASSES[index % PASTEL_CLASSES.length];

  return (
    <Link
      href={`/my-collaborations/${project.myStatus}/${project.id}`}
      className={clsx(
        "card-stagger group relative flex cursor-pointer flex-col gap-3 rounded-2xl p-4 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.06),0_12px_28px_-12px_rgba(var(--uf-shadow-rgb),0.20)]",
        pastel
      )}
      style={{ "--stagger-i": String(Math.min(index, 11)) } as CSSProperties}
    >
      {/* Skill tags — the reference's #website / #client row. */}
      <span className="flex flex-wrap gap-1.5">
        {project.skills.slice(0, 3).map((s) => (
          <span key={s.id} className="kanban-tag rounded-full px-2.5 py-1 text-[11px] font-medium">
            {s.label}
          </span>
        ))}
        {project.skills.length > 3 && (
          <span className="kanban-tag rounded-full px-2.5 py-1 text-[11px] font-medium">
            +{project.skills.length - 3} more
          </span>
        )}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] leading-snug font-semibold text-ink">
          {project.title}
        </span>
        <span className="truncate text-[13px] text-muted">
          {project.subtitle}
        </span>
      </span>
      {/* Seat meter — the reference's dotted Progress slot.
          Dots, not bars: filled = ink, next open = accent,
          open = placeholder. */}
      <span className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted">
          Seats · {project.slotsFilled} of {project.slotsTotal}
        </span>
        <span
          className="flex gap-[3px]"
          role="img"
          aria-label={`${project.slotsFilled} of ${project.slotsTotal} seats filled`}
        >
          {Array.from({ length: project.slotsTotal }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                "size-2 rounded-full",
                i < project.slotsFilled
                  ? "bg-ink"
                  : i === project.slotsFilled
                    ? "bg-accent"
                    : "bg-placeholder"
              )}
            />
          ))}
        </span>
      </span>
      <span className="mt-auto flex items-center gap-2 pt-1">
        <Avatar
          size={28}
          src={project.owner.avatarUrl}
          alt={project.owner.name}
        />
        <span className="text-[13px] font-medium text-muted">
          {project.owner.name}
        </span>
        <span
          className={clsx(
            "ms-auto flex items-center gap-1.5 text-xs",
            urgent ? "font-semibold text-badge" : "text-muted"
          )}
        >
          <Icon name="calendar" size={14} />
          Due {formatDueDate(project.dueDate)}
          {urgent &&
            ` · ${daysLeft !== null && daysLeft <= 0 ? "due now" : `${daysLeft}d left`}`}
        </span>
      </span>
    </Link>
  );
}

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
  const [collapsed, setCollapsed] = useState<Set<MyCollabStatus>>(
    () => new Set()
  );

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

  const toggleColumn = (slug: MyCollabStatus) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

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
            const isCollapsed = collapsed.has(slug);
            return (
              <section
                key={slug}
                aria-label={cat.crumbLabel}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  <button
                    type="button"
                    aria-label={
                      isCollapsed
                        ? `Expand ${cat.crumbLabel}`
                        : `Collapse ${cat.crumbLabel}`
                    }
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleColumn(slug)}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <Icon
                      name="chevron-down"
                      size={16}
                      className={clsx(
                        "transition-transform duration-200",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  </button>
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
                {!isCollapsed && (
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
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
