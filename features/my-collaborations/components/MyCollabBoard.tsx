"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate, parseDueDate } from "@/features/collaborations/sort";
import {
  MY_COLLAB_CATEGORIES,
  getCategory,
} from "../types";
import type { MyCollabCategory, MyCollabProject, MyCollabStatus } from "../types";

/**
 * Dashboard order for the header stats + the status chips:
 * the category-table order (Not Started, Pending, Complete,
 * Revise) — it also happens to read largest-first (4, 3, 3, 2).
 */
const STATS_ORDER: MyCollabStatus[] = [
  "not-started",
  "pending",
  "complete",
  "revise",
];

/**
 * The status color code — one color per myStatus. The header
 * stats' dots and the card status pills both reuse it. Complete
 * earns the accent; revise is the one red moment; pending is
 * ink; not-started stays quiet.
 */
const STATUS_SEGMENT_CLASS: Record<MyCollabStatus, string> = {
  revise: "bg-badge",
  pending: "bg-ink",
  "not-started": "bg-placeholder",
  complete: "bg-accent",
};

const STATUS_CHIPS: { value: MyCollabStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not Started" },
  { value: "pending", label: "Pending" },
  { value: "complete", label: "Complete" },
  { value: "revise", label: "Revise" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One project card for the dashboard grid — the reference's lead
 * card, translated to our language: owner avatar + a circular
 * arrow to the detail, title + subtitle, skill pills, and a
 * footer of seat meter + due date + status pill. The whole card
 * is the link; there is no inner button, so no stretched-link
 * layering is needed.
 */
function MyCollabCard({
  project,
  index,
}: {
  project: MyCollabProject;
  index: number;
}) {
  const category = getCategory(project.myStatus);
  const dueMs = parseDueDate(project.dueDate);
  const daysLeft =
    dueMs === Infinity
      ? null
      : Math.ceil((dueMs - Date.now()) / DAY_MS);
  const urgent =
    project.myStatus !== "complete" && daysLeft !== null && daysLeft <= 7;

  return (
    <Link
      href={`/my-collaborations/${project.myStatus}/${project.id}`}
      className="card-stagger group flex cursor-pointer flex-col gap-3 rounded-3xl border border-line bg-surface p-4 transition-[border-color,box-shadow] duration-200 hover:border-ink/30 hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.05),0_12px_28px_-12px_rgba(var(--uf-shadow-rgb),0.18)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      style={{ "--stagger-i": String(Math.min(index, 11)) } as CSSProperties}
    >
      <span className="flex items-start justify-between">
        <Avatar
          size={40}
          src={project.owner.avatarUrl}
          alt={project.owner.name}
        />
        <span className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition group-hover:border-ink/30 group-hover:text-ink">
          <Icon name="arrow-up-right" size={16} />
        </span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] leading-snug font-semibold text-ink">
          {project.title}
        </span>
        <span className="truncate text-[13px] text-muted">
          {project.subtitle}
        </span>
      </span>
      <span className="flex flex-wrap gap-1.5">
        {project.skills.slice(0, 3).map((s) => (
          <span
            key={s.id}
            className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-muted"
          >
            {s.label}
          </span>
        ))}
        {project.skills.length > 3 && (
          <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-subtle">
            +{project.skills.length - 3} more
          </span>
        )}
      </span>
      <span className="mt-auto flex items-center gap-3 border-t border-line pt-3">
        <span
          className="flex gap-[3px]"
          role="img"
          aria-label={`${project.slotsFilled} of ${project.slotsTotal} seats filled`}
        >
          {Array.from({ length: project.slotsTotal }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                "h-1.5 w-3 rounded-full",
                i < project.slotsFilled
                  ? "bg-ink"
                  : i === project.slotsFilled
                    ? "bg-accent"
                    : "bg-placeholder"
              )}
            />
          ))}
        </span>
        <span
          className={clsx(
            "flex items-center gap-1.5 text-xs",
            urgent ? "font-semibold text-badge" : "text-muted"
          )}
        >
          <Icon name="calendar" size={14} />
          Due {formatDueDate(project.dueDate)}
          {urgent &&
            ` · ${daysLeft !== null && daysLeft <= 0 ? "due now" : `${daysLeft}d left`}`}
        </span>
        {category && (
          <span
            className={clsx(
              "ms-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              category.pillClassName
            )}
          >
            {category.crumbLabel}
          </span>
        )}
      </span>
    </Link>
  );
}

interface MyCollabBoardProps {
  projects: MyCollabProject[];
}

/**
 * The user's project dashboard (2026 redesign, reference = the
 * CRM workspace shot): a header of big title + status stats,
 * then the project grid with status chips + search. The schedule
 * bar and the Needs Attention section were removed on the user's
 * order (2026-11-09) — and the sort + type dropdowns and the
 * New Project button followed the same day: the board is title
 * + stats + a search-and-chip grid only, in the mock's default
 * order. The old register band and its progress track are gone
 * — the counts now live in the header stats; the status-section
 * ledgers are gone — the chips filter one grid. The category
 * and detail pages keep their rows; only this board is a
 * dashboard. Search/status apply to the grid; stats always
 * describe the full portfolio, never the filter. New projects
 * are still created from the public Collaborations page.
 */
export function MyCollabBoard({ projects }: MyCollabBoardProps) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MyCollabStatus | "all">(
    "all"
  );

  const filtered = useMemo(() => {
    let result = projects;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.myStatus === statusFilter);
    }
    return result;
  }, [projects, query, statusFilter]);

  const clearAll = () => {
    setDraftQuery("");
    setQuery("");
    setStatusFilter("all");
  };

  const bySlug = new Map<MyCollabStatus, MyCollabCategory>(
    MY_COLLAB_CATEGORIES.map((c) => [c.slug, c])
  );

  // Stats describe the FULL portfolio, never the filtered view.
  const statusCounts = new Map<MyCollabStatus, number>(
    STATS_ORDER.map((slug) => [
      slug,
      projects.filter((p) => p.myStatus === slug).length,
    ])
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header — big title, status stats right. */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h1 className="text-[40px] leading-none font-semibold tracking-tight text-ink uppercase">
          My Collaborations
        </h1>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          {STATS_ORDER.map((slug) => {
            const cat = bySlug.get(slug);
            if (!cat) return null;
            return (
              <Link
                key={slug}
                href={`/my-collaborations/${slug}`}
                className="group flex flex-col gap-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <span className="text-3xl leading-none font-semibold text-ink tabular-nums transition-colors group-hover:text-accent">
                  {statusCounts.get(slug)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <span
                    className={`size-2 rounded-full ${STATUS_SEGMENT_CLASS[slug]}`}
                  />
                  {cat.crumbLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* My projects — one filterable card grid. */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink">
            My Projects
            <span className="text-accent tabular-nums">
              {filtered.length}
            </span>
          </span>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 focus-within:ring-2 focus-within:ring-accent">
              <Icon name="search" size={16} className="shrink-0 text-muted" />
              <input
                type="text"
                value={draftQuery}
                onChange={(e) => {
                  setDraftQuery(e.target.value);
                  setQuery(e.target.value);
                }}
                placeholder="Search"
                aria-label="Search projects"
                className="w-28 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted sm:w-36"
              />
              {draftQuery !== "" && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setDraftQuery("");
                    setQuery("");
                  }}
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bg text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
                aria-pressed={statusFilter === chip.value}
                className={clsx(
                  "pressable h-9 cursor-pointer rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  statusFilter === chip.value
                    ? "bg-ink text-surface"
                    : "border border-line bg-surface text-ink hover:border-ink/30"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-bg px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface">
              <Icon name="search" size={20} className="text-muted" />
            </span>
            <p className="text-base font-semibold text-ink">
              No projects match
            </p>
            <p className="max-w-sm text-sm text-muted">
              No projects match your search and filters. Clear them to see
              all projects.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="pressable mt-2 cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Clear search &amp; filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <MyCollabCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
