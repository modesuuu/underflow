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
 * The status color code — one color per myStatus. The band's
 * register dots teach it once and the section pills below
 * reuse it. Complete earns the accent; revise is the one red
 * moment; pending is ink; not-started stays quiet.
 */
const STATUS_SEGMENT_CLASS: Record<MyCollabStatus, string> = {
  revise: "bg-badge",
  pending: "bg-ink",
  "not-started": "bg-placeholder",
  complete: "bg-accent",
};

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
 * spotlight (full width, larger disc and title); the rest
 * pair up beneath it. The revise card's disc is the red one:
 * it is the only item that demands action from the user.
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
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface transition-[border-color,box-shadow] duration-200 hover:border-ink/30 hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.05),0_12px_28px_-12px_rgba(var(--uf-shadow-rgb),0.18)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
        spotlight ? "p-5" : "p-4"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center ${
          spotlight ? "size-11 rounded-xl" : "size-9 rounded-lg"
        } ${card.hot ? "bg-badge/10 text-badge" : "bg-bg text-ink"}`}
      >
        <Icon name={card.icon} size={spotlight ? 20 : 18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium tracking-wide text-subtle uppercase">
          {card.label}
        </span>
        <span
          className={`truncate font-semibold text-ink ${
            spotlight ? "text-[15px]" : "text-sm"
          }`}
        >
          {card.title}
        </span>
        <span className="truncate text-xs text-muted">{card.sub}</span>
      </span>
      <Icon
        name="chevron-right"
        size={18}
        className="shrink-0 text-placeholder transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </Link>
  );
}

function StatusSection({
  category,
  items,
}: {
  category: MyCollabCategory;
  items: MyCollabProject[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3 px-3">
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
      <div className="flex flex-col divide-y divide-line/50 border-y border-line/50">
        {items.length === 0 ? (
          <p className="py-4 text-xs text-muted">No projects in this section.</p>
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
 * The user's project cockpit (2026 redesign v3): the
 * portfolio band as a register (the completion count as the
 * lead figure, the four status counts as a clickable
 * register whose dots teach the color code, one thin track
 * for the proportion; every number appears exactly once),
 * then what needs the user with the most urgent item leading
 * as a spotlight card, then the toolbar, then status
 * sections ordered by actionability. Everything sits in the
 * app's own container language; the rows borrow the
 * collaborations river's seat meter so the two project
 * lists rhyme. Search/sort/filter apply across sections;
 * stats always describe the full portfolio, never the
 * filter.
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
  // A whole percent: 3 of 12 projects does not need decimals.
  const pctInt = Math.round(pctNum);

  // Attention: only items with something real behind them render.
  const reviseItems = projects.filter((p) => p.myStatus === "revise");
  const nextDeadline = projects
    .filter((p) => p.myStatus !== "complete")
    .map((p) => ({ project: p, due: parseDueDate(p.dueDate) }))
    .filter((x) => x.due !== Infinity)
    .sort((a, b) => a.due - b.due)[0];

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

      {/* The band — the portfolio as a register: the completion
          count as the lead figure, the four status counts as a
          clickable register (their dots teach the color code),
          and one thin track for the proportion. Every number
          appears exactly once. */}
      <div
        className="card-stagger flex flex-col gap-5 rounded-[24px] bg-bg p-5 sm:p-6"
        style={{ "--stagger-i": "0" } as CSSProperties}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex shrink-0 flex-col gap-1">
            <span className="text-[56px] leading-[0.85] font-medium tracking-tight text-ink tabular-nums sm:text-[64px]">
              {complete}
              <span className="text-[24px] font-medium text-muted sm:text-[28px]">
                {" "}
                / {projects.length}
              </span>
            </span>
            <span className="text-xs font-medium tracking-wide text-subtle uppercase">
              Projects complete
            </span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-1 sm:grid-cols-4 lg:border-l lg:border-line lg:pl-8">
            {SECTION_ORDER.map((slug) => {
              const cat = bySlug.get(slug);
              if (!cat) return null;
              return (
                <Link
                  key={slug}
                  href={`/my-collaborations/${slug}`}
                  className="group flex flex-col gap-1.5 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <span
                      className={`size-2 rounded-full ${STATUS_SEGMENT_CLASS[slug]}`}
                    />
                    {cat.crumbLabel}
                  </span>
                  <span className="text-2xl leading-none font-semibold text-ink tabular-nums">
                    {statusCounts.get(slug)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div
            className="h-2 overflow-hidden rounded-full bg-placeholder"
            role="img"
            aria-label={`${complete} of ${projects.length} projects complete`}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${pctNum}%` }}
            />
          </div>
          <p className="text-sm text-muted">
            {pctInt}% of your portfolio is complete · {active} still in
            motion
          </p>
        </div>
      </div>

      {/* What needs the user — the most urgent item leads as a
          full-width spotlight; the rest pair up beneath it. */}
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
                  "--stagger-i": String(i + 2),
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
