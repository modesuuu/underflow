"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate, parseDueDate } from "@/features/collaborations/sort";
import { MakeCollabModal } from "@/features/collaborations/components/MakeCollabModal";
import { sortMyProjects } from "../sort";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";
import {
  MY_COLLAB_CATEGORIES,
  getCategory,
} from "../types";
import type { MyCollabCategory, MyCollabProject, MyCollabStatus } from "../types";
import { Dropdown } from "./MyCollabSearchBar";

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

const SORT_OPTIONS: { value: CollabSortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "due", label: "Due soonest" },
  { value: "newest", label: "Newest" },
];

const TYPE_OPTIONS: { value: CollabFilterType; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "coursework", label: "Coursework" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

interface AttentionItem {
  icon: string;
  label: string;
  title: string;
  sub: string;
  href: string;
  hot?: boolean;
}

/**
 * One attention card. The most urgent item renders as the
 * spotlight (full width, larger disc and title); the rest pair
 * up beneath it. The revise card is the accent one — the
 * dashboard's highlighted card, like the reference's orange
 * task card — it is the only item that demands action.
 */
function AttentionCard({
  card,
  spotlight = false,
}: {
  card: AttentionItem;
  spotlight?: boolean;
}) {
  return (
    <Link
      href={card.href}
      className={clsx(
        "group flex cursor-pointer items-center gap-3 rounded-2xl border transition-[border-color,box-shadow,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
        spotlight ? "p-5" : "p-4",
        card.hot
          ? "border-transparent bg-accent text-on-accent hover:opacity-90"
          : "border-line bg-surface text-ink hover:border-ink/30 hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.05),0_12px_28px_-12px_rgba(var(--uf-shadow-rgb),0.18)]"
      )}
    >
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center",
          spotlight ? "size-11 rounded-xl" : "size-9 rounded-lg",
          card.hot ? "bg-on-accent/15 text-on-accent" : "bg-bg text-ink"
        )}
      >
        <Icon name={card.icon} size={spotlight ? 20 : 18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={clsx(
            "text-[11px] font-medium tracking-wide uppercase",
            card.hot ? "text-on-accent/70" : "text-subtle"
          )}
        >
          {card.label}
        </span>
        <span
          className={clsx(
            "truncate font-semibold",
            spotlight ? "text-[15px]" : "text-sm",
            card.hot ? "text-on-accent" : "text-ink"
          )}
        >
          {card.title}
        </span>
        <span
          className={clsx(
            "truncate text-xs",
            card.hot ? "text-on-accent/70" : "text-muted"
          )}
        >
          {card.sub}
        </span>
      </span>
      <Icon
        name="chevron-right"
        size={18}
        className={clsx(
          "shrink-0 transition-all duration-200 group-hover:translate-x-0.5",
          card.hot
            ? "text-on-accent/60 group-hover:text-on-accent"
            : "text-placeholder group-hover:text-ink"
        )}
      />
    </Link>
  );
}

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
      className="card-stagger group flex cursor-pointer flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-[border-color,box-shadow] duration-200 hover:border-ink/30 hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.05),0_12px_28px_-12px_rgba(var(--uf-shadow-rgb),0.18)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
 * CRM workspace shot): a schedule bar of the next deadlines, a
 * header of big title + New Project + status stats, what needs
 * the user as cards (the revise one highlighted in accent),
 * then the project grid with status chips + search + sort +
 * type. The old register band and its progress track are gone —
 * the counts now live in the header stats; the status-section
 * ledgers are gone — the chips filter one grid. The category
 * and detail pages keep their rows; only this board is a
 * dashboard. Search/sort/type/status apply to the grid;
 * stats always describe the full portfolio, never the filter.
 */
export function MyCollabBoard({ projects }: MyCollabBoardProps) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<CollabSortKey>("recommended");
  const [typeFilter, setTypeFilter] = useState<CollabFilterType>("all");
  const [statusFilter, setStatusFilter] = useState<MyCollabStatus | "all">(
    "all"
  );
  const [modalOpen, setModalOpen] = useState(false);

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
    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.myStatus === statusFilter);
    }
    return sortMyProjects(result, sortKey);
  }, [projects, query, typeFilter, statusFilter, sortKey]);

  const clearAll = () => {
    setDraftQuery("");
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  // Stats describe the FULL portfolio, never the filtered view.
  const pendingItems = projects.filter((p) => p.myStatus === "pending");

  // Schedule bar: the next deadlines, soonest first.
  const upcoming = projects
    .filter((p) => p.myStatus !== "complete")
    .map((p) => ({ project: p, due: parseDueDate(p.dueDate) }))
    .filter((x) => x.due !== Infinity)
    .sort((a, b) => a.due - b.due)
    .slice(0, 3);
  const nextDeadline = upcoming[0];
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Attention: only items with something real behind them render.
  const reviseItems = projects.filter((p) => p.myStatus === "revise");

  const attention: AttentionItem[] = [];
  if (reviseItems.length > 0) {
    attention.push({
      icon: "revision",
      label: "Needs another pass",
      title: `${reviseItems.length} project${reviseItems.length > 1 ? "s" : ""} waiting on you`,
      sub: reviseItems[0].title,
      href: "/my-collaborations/revise",
      hot: true,
    });
  }
  if (nextDeadline) {
    attention.push({
      icon: "calendar",
      label: "Next deadline",
      title: nextDeadline.project.title,
      sub: `Due ${formatDueDate(nextDeadline.project.dueDate)}`,
      href: `/my-collaborations/${nextDeadline.project.myStatus}/${nextDeadline.project.id}`,
    });
  }
  if (pendingItems.length > 0) {
    attention.push({
      icon: "loader-circle",
      label: "Waiting for review",
      title: `${pendingItems.length} application${pendingItems.length > 1 ? "s" : ""} pending`,
      sub: pendingItems[0].title,
      href: "/my-collaborations/pending",
    });
  }

  const bySlug = new Map<MyCollabStatus, MyCollabCategory>(
    MY_COLLAB_CATEGORIES.map((c) => [c.slug, c])
  );

  const statusCounts = new Map<MyCollabStatus, number>(
    STATS_ORDER.map((slug) => [
      slug,
      projects.filter((p) => p.myStatus === slug).length,
    ])
  );

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort";
  const typeLabel =
    TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? "Type";

  return (
    <div className="flex flex-col gap-6">
      {/* Schedule bar — the reference's "Your Schedule" pill:
          today + the next deadlines, soonest first. */}
      <div className="card-stagger no-scrollbar flex items-center gap-3 overflow-x-auto rounded-full border border-line bg-surface px-4 py-2.5">
        <span className="shrink-0 text-sm font-semibold text-ink">
          Your Schedule
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted">
          <Icon name="calendar" size={14} />
          {todayLabel}
        </span>
        {upcoming.length === 0 ? (
          <span className="shrink-0 text-xs text-muted">
            No upcoming deadlines.
          </span>
        ) : (
          upcoming.map(({ project }) => (
            <Link
              key={project.id}
              href={`/my-collaborations/${project.myStatus}/${project.id}`}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="calendar" size={13} className="text-muted" />
              <span className="text-muted">
                {formatDueDate(project.dueDate)}
              </span>
              <span className="max-w-36 truncate">{project.title}</span>
            </Link>
          ))
        )}
        {nextDeadline && (
          <Link
            href={`/my-collaborations/${nextDeadline.project.myStatus}/${nextDeadline.project.id}`}
            aria-label="Open the next deadline"
            className="ms-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="arrow-up-right" size={16} />
          </Link>
        )}
      </div>

      {/* Header — big title + New Project, status stats right. */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[40px] leading-none font-semibold tracking-tight text-ink uppercase">
            My Collaborations
          </h1>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="pressable flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="plus" size={16} />
            New Project
          </button>
        </div>
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

      {/* What needs the user — the most urgent item leads as a
          full-width spotlight; the rest pair up beneath it. */}
      <section className="flex flex-col gap-3">
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink">
          Needs Attention
          <span className="text-accent tabular-nums">{attention.length}</span>
        </span>
        {attention.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Icon name="check-circle" size={18} className="text-ink" />
            Nothing needs your attention.
          </p>
        ) : (
          <div
            className="card-stagger flex flex-col gap-3"
            style={{ "--stagger-i": "1" } as CSSProperties}
          >
            <AttentionCard card={attention[0]} spotlight />
            {attention.length > 1 && (
              <div
                className={`grid gap-3 ${attention.length > 2 ? "sm:grid-cols-2" : ""}`}
              >
                {attention.slice(1).map((card) => (
                  <AttentionCard key={card.label} card={card} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

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
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-haspopup="true"
                  className="pressable flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="sort" size={15} />
                  <span>{sortLabel}</span>
                  <Icon name="chevron-down" size={14} className="text-muted" />
                </button>
              }
              panel={
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted">
                    Sort by
                  </span>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      data-close-panel
                      onClick={() => setSortKey(opt.value)}
                      className={clsx(
                        "pressable cursor-pointer rounded px-2 py-1 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                        sortKey === opt.value
                          ? "bg-accent font-medium text-on-accent"
                          : "text-ink hover:bg-bg"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              }
            />
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-haspopup="true"
                  className="pressable flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="filter" size={15} />
                  <span>{typeLabel}</span>
                  {typeFilter !== "all" && (
                    <span className="flex size-[18px] items-center justify-center rounded-full bg-badge text-[10px] font-semibold text-surface">
                      1
                    </span>
                  )}
                </button>
              }
              panel={
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted">Type</span>
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      data-close-panel
                      onClick={() => setTypeFilter(opt.value)}
                      className={clsx(
                        "pressable cursor-pointer rounded px-2 py-1 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                        typeFilter === opt.value
                          ? "bg-accent font-medium text-on-accent"
                          : "text-ink hover:bg-bg"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              }
            />
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

      <MakeCollabModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
