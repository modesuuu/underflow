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
 * section pills below. Complete earns the lime; revise is the
 * one red moment; pending is ink; not-started stays quiet.
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${category.pillClassName}`}
        >
          <Icon name={category.icon} size={14} />
          {category.boardLabel}
        </span>
        <span className="text-xs font-medium text-subtle tabular-nums">
          {items.length}
        </span>
        <span className="hidden text-xs text-muted sm:block">
          {category.subtitle}
        </span>
        <Link
          href={`/my-collaborations/${category.slug}`}
          className="ms-auto flex shrink-0 cursor-pointer items-center gap-1 text-[13px] font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          View all
          <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-placeholder rounded-2xl bg-bg px-4">
        {items.length === 0 ? (
          <p className="py-4 text-xs text-muted">No projects here yet.</p>
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
 * The user's project cockpit (2026 redesign): a one-bar stat
 * register with a real completion track, an attention strip
 * computed from the data (revisions waiting, the next deadline,
 * pending applications), then the portfolio as status sections
 * ordered by actionability. Sections show every project as a
 * dense row — no two-card truncation hiding the rest behind a
 * drill-down. Search/sort/type-filter apply across all sections;
 * stats always describe the full portfolio, never the filter.
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
  }[] = [];
  if (reviseItems.length > 0) {
    attention.push({
      icon: "revision",
      label: "Needs another pass",
      title: `${reviseItems.length} project${reviseItems.length > 1 ? "s" : ""} waiting on you`,
      sub: reviseItems[0].title,
      href: "/my-collaborations/revise",
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
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold text-ink">
          Welcome back, {CURRENT_USER.name}
        </h1>
        <p className="text-sm text-muted">See your projects here.</p>
      </div>

      {/* Portfolio header — the signature strip. Every project is
          one segment of a single bar, colored by its status,
          hoverable and clickable: the whole portfolio in one
          line, with the completion figure set as a display
          numeral beside it. */}
      <div
        className="card-stagger flex flex-col gap-5 rounded-2xl bg-bg p-5 sm:p-6"
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

      {/* Attention strip — or one calm line when nothing needs you */}
      {attention.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon name="check-circle" size={18} className="text-ink" />
          You&rsquo;re all caught up — nothing needs you right now.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {attention.map((card, ai) => (
            <Link
              key={card.label}
              href={card.href}
              style={{ "--stagger-i": String(ai + 1) } as CSSProperties}
              className="card-stagger group flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-[border-color,box-shadow] duration-200 hover:border-ink/30 hover:shadow-[0_1px_2px_rgba(17,17,17,0.05),0_12px_28px_-12px_rgba(17,17,17,0.18)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg">
                <Icon name={card.icon} size={18} className="text-ink" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] font-medium tracking-wide text-subtle uppercase">
                  {card.label}
                </span>
                <span className="truncate text-sm font-semibold text-ink">
                  {card.title}
                </span>
                <span className="truncate text-xs text-muted">{card.sub}</span>
              </span>
              <Icon
                name="chevron-right"
                size={18}
                className="shrink-0 text-placeholder transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      )}

      <MyCollabSearchBar
        draftQuery={draftQuery}
        onDraftChange={setDraftQuery}
        onSearch={() => setQuery(draftQuery)}
        sortKey={sortKey}
        onSortChange={setSortKey}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-bg px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface">
            <Icon name="search" size={20} className="text-muted" />
          </span>
          <p className="text-base font-semibold text-ink">No projects match</p>
          <p className="max-w-sm text-sm text-muted">
            Nothing in your collaborations matches that search and filter
            set. Try a different title, or clear them to see everything.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraftQuery("");
              setQuery("");
              setTypeFilter("all");
            }}
            className="pressable mt-2 cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        SECTION_ORDER.map((slug, i) => {
          const category = bySlug.get(slug);
          if (!category) return null;
          const items = filtered.filter((p) => p.myStatus === slug);
          if (searching && items.length === 0) return null;
          return (
            <div
              key={slug}
              className="card-stagger"
              style={
                {
                  "--stagger-i": String(i + attention.length + 1),
                } as CSSProperties
              }
            >
              <StatusSection category={category} items={items} />
            </div>
          );
        })
      )}
    </div>
  );
}
