"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/components/layout/nav";
import { formatDueDate, parseDueDate } from "@/features/collaborations/sort";
import { sortMyProjects } from "../sort";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";
import { MY_COLLAB_CATEGORIES } from "../types";
import type { MyCollabCategory, MyCollabProject, MyCollabStatus } from "../types";
import { MyCollabRow } from "./MyCollabRow";
import { MyCollabSearchBar } from "./MyCollabSearchBar";

/**
 * Sections are ordered by actionability, not by the canonical
 * category table: what needs the user first (Revise), then what
 * they are waiting on (Pending), then the queue (Not started),
 * then the archive (Complete).
 */
const SECTION_ORDER: MyCollabStatus[] = [
  "revise",
  "pending",
  "not-started",
  "complete",
];

/**
 * The portfolio strip's color code — one color per myStatus,
 * taught once by the legend under the strip and reused by the
 * section dots on the stage below. Complete earns the accent;
 * revise is the one red moment; pending is ink; not-started
 * stays quiet.
 */
const STATUS_SEGMENT_CLASS: Record<MyCollabStatus, string> = {
  revise: "bg-badge",
  pending: "bg-ink",
  "not-started": "bg-placeholder",
  complete: "bg-accent",
};

function StatusSection({
  category,
  items,
}: {
  category: MyCollabCategory;
  items: MyCollabProject[];
}) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-2.5 px-1 pb-1.5">
        <span
          aria-hidden="true"
          className={`size-2.5 shrink-0 rounded-full ring-1 ring-surface/25 ${STATUS_SEGMENT_CLASS[category.slug]}`}
        />
        <h2 className="text-[15px] font-semibold text-surface">
          {category.boardLabel}
        </h2>
        <span className="text-xs font-medium text-surface/50 tabular-nums">
          {items.length}
        </span>
        <span className="hidden text-xs text-surface/45 sm:block">
          {category.subtitle}
        </span>
        <Link
          href={`/my-collaborations/${category.slug}`}
          className="ms-auto flex shrink-0 cursor-pointer items-center gap-1 text-[13px] font-medium text-surface/70 transition-colors hover:text-surface focus-visible:ring-2 focus-visible:ring-surface focus-visible:outline-none"
        >
          View all
          <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-surface/10">
        {items.length === 0 ? (
          <p className="px-1 py-3 text-xs text-surface/45">
            No projects in this section.
          </p>
        ) : (
          items.map((p) => <MyCollabRow key={p.id} project={p} />)
        )}
      </div>
    </section>
  );
}

interface MyCollabBoardProps {
  projects: MyCollabProject[];
}

/**
 * The user's project cockpit, staged (2026 redesign, from the
 * reference the user supplied): a summary band on the canvas
 * (completion set as a display figure, every project one
 * segment of a single bar), the toolbar, then THE STAGE — one
 * ink panel (cream in the dark theme) holding the work: the
 * attention row computed from the data, then status sections
 * ordered by actionability. The stage gives the working area
 * one ground and makes it the screen's focal object; inside
 * it every color is a stage color (text-surface and its alpha
 * steps), and the status color code is carried by dots
 * because pills would fight the stage ground. Search, sort,
 * and type-filter apply across sections; stats always
 * describe the full portfolio, never the filter.
 */
export function MyCollabBoard({ projects }: MyCollabBoardProps) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<CollabSortKey>("recommended");
  const [typeFilter, setTypeFilter] = useState<CollabFilterType>("all");

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
    return sortMyProjects(result, sortKey);
  }, [projects, query, typeFilter, sortKey]);

  const searching = query.trim() !== "" || typeFilter !== "all";

  // Stats describe the FULL portfolio, never the filtered view.
  const active = projects.filter((p) => p.myStatus !== "complete").length;
  const pendingItems = projects.filter((p) => p.myStatus === "pending");
  const complete = projects.filter((p) => p.myStatus === "complete").length;
  const pctNum =
    projects.length === 0 ? 0 : (complete / projects.length) * 100;
  const pct = `${pctNum.toFixed(2)}%`;
  // The hero figure typesets the integer huge and the decimals small.
  const [pctInt, pctDec] = pctNum.toFixed(2).split(".");

  // Attention: only cards with something real behind them render.
  const reviseItems = projects.filter((p) => p.myStatus === "revise");
  const nextDeadline = projects
    .filter((p) => p.myStatus !== "complete")
    .map((p) => ({ project: p, due: parseDueDate(p.dueDate) }))
    .filter((x) => x.due !== Infinity)
    .sort((a, b) => a.due - b.due)[0];

  const attention: {
    icon: string;
    label: string;
    title: string;
    sub: string;
    href: string;
    hot?: boolean;
  }[] = [];
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

  // The portfolio strip: every project becomes one segment,
  // grouped by status in section order.
  const stripSegments = SECTION_ORDER.flatMap((slug) =>
    projects
      .filter((p) => p.myStatus === slug)
      .map((p) => ({ project: p, slug }))
  );
  const statusCounts = new Map<MyCollabStatus, number>(
    SECTION_ORDER.map((slug) => [
      slug,
      projects.filter((p) => p.myStatus === slug).length,
    ])
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[32px] font-semibold text-ink">
        Welcome back, {CURRENT_USER.name}
      </h1>

      {/* The band — the portfolio in one line: completion as a
          display figure, companion counts, and a bar where every
          project is one segment colored by its status. The
          legend under the bar teaches the color code the stage
          below reuses as dots. */}
      <div
        className="card-stagger flex flex-col gap-5 rounded-[24px] bg-bg p-5 sm:p-6"
        style={{ "--stagger-i": "0" } as CSSProperties}
      >
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[56px] leading-[0.85] font-medium tracking-tight text-ink tabular-nums sm:text-[68px]">
              {pctInt}
              <span className="text-[24px] font-medium text-muted sm:text-[28px]">
                .{pctDec}%
              </span>
            </span>
            <span className="text-sm text-muted">
              of your portfolio is complete · {active} active of{" "}
              {projects.length} projects
            </span>
          </div>
          <div className="ms-auto flex items-end gap-6 sm:gap-8">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl leading-none font-semibold text-ink tabular-nums">
                {active}
              </span>
              <span className="text-xs font-medium text-muted">Active</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xl leading-none font-semibold text-ink tabular-nums">
                {pendingItems.length}
              </span>
              <span className="text-xs font-medium text-muted">Pending</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xl leading-none font-semibold text-ink tabular-nums">
                {complete}
              </span>
              <span className="text-xs font-medium text-muted">Complete</span>
            </div>
          </div>
        </div>

        {/* The strip + its legend (the counts are the legend) */}
        <div className="flex flex-col gap-2">
          <div
            className="flex gap-1"
            role="list"
            aria-label="Your projects by status"
          >
            {stripSegments.map(({ project, slug }, i) => (
              <Link
                key={project.id}
                href={`/my-collaborations/${slug}/${project.id}`}
                role="listitem"
                aria-label={`${project.title} — ${bySlug.get(slug)?.crumbLabel ?? slug}`}
                className={`group relative h-3.5 min-w-3 flex-1 rounded-full ${STATUS_SEGMENT_CLASS[slug]} transition-transform duration-200 motion-safe:hover:scale-y-125 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none [animation:uf-card-in_320ms_var(--uf-ease-out)_backwards]`}
                style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
              >
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-[160px] -translate-x-1/2 translate-y-1 truncate rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-surface opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                  {project.title}
                </span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {SECTION_ORDER.map((slug) => (
              <span
                key={slug}
                className="flex items-center gap-1.5 text-xs text-muted"
              >
                <span
                  className={`size-2 rounded-full ${STATUS_SEGMENT_CLASS[slug]}`}
                />
                {bySlug.get(slug)?.crumbLabel}
                <span className="font-semibold text-ink tabular-nums">
                  {statusCounts.get(slug)}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <MyCollabSearchBar
        draftQuery={draftQuery}
        onDraftChange={setDraftQuery}
        onSearch={() => setQuery(draftQuery)}
        sortKey={sortKey}
        onSortChange={setSortKey}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {/* THE STAGE — one ground for all the work: what needs the
          user first, then every section on the same ink. */}
      <div
        className="card-stagger flex flex-col gap-8 rounded-[28px] bg-ink p-5 text-surface sm:p-7"
        style={{ "--stagger-i": "1" } as CSSProperties}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface/10">
              <Icon name="search" size={20} className="text-surface/60" />
            </span>
            <p className="text-base font-semibold text-surface">
              No projects match
            </p>
            <p className="max-w-sm text-sm text-surface/60">
              No projects match your search and filters. Clear them to see
              all projects.
            </p>
            <button
              type="button"
              onClick={() => {
                setDraftQuery("");
                setQuery("");
                setTypeFilter("all");
              }}
              className="pressable mt-2 cursor-pointer rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-surface focus-visible:outline-none"
            >
              Clear search &amp; filters
            </button>
          </div>
        ) : (
          <>
            {/* Attention row — only cards with something real
                behind them. The revise card's disc is the stage's
                one saturated moment: it is the only card that
                demands action from the user. */}
            {attention.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-surface/70">
                <Icon name="check-circle" size={18} className="text-surface" />
                Nothing needs your attention.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {attention.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-surface/10 p-4 transition-colors duration-200 hover:bg-surface/15 focus-visible:ring-2 focus-visible:ring-surface focus-visible:outline-none"
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        card.hot
                          ? "bg-badge text-white"
                          : "bg-surface/12 text-surface"
                      }`}
                    >
                      <Icon name={card.icon} size={18} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[11px] font-medium tracking-wide text-surface/50 uppercase">
                        {card.label}
                      </span>
                      <span className="truncate text-sm font-semibold text-surface">
                        {card.title}
                      </span>
                      <span className="truncate text-xs text-surface/55">
                        {card.sub}
                      </span>
                    </span>
                    <Icon
                      name="chevron-right"
                      size={18}
                      className="shrink-0 text-surface/40 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-8">
              {SECTION_ORDER.map((slug) => {
                const category = bySlug.get(slug);
                if (!category) return null;
                const items = filtered.filter((p) => p.myStatus === slug);
                if (searching && items.length === 0) return null;
                return (
                  <StatusSection
                    key={slug}
                    category={category}
                    items={items}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
