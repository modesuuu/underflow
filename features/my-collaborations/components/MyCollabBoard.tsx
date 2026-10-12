"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/components/layout/nav";
import { sortMyProjects } from "../sort";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";
import { MY_COLLAB_CATEGORIES } from "../types";
import type { MyCollabProject } from "../types";
import { MyCollabCard } from "./MyCollabCard";
import { MyCollabSearchBar } from "./MyCollabSearchBar";

/** Cards shown per board column before the "View More" link. */
const CARDS_PER_COLUMN = 2;

interface StatProps {
  value: string;
  label: string;
}

/* A stat is a computation tally on the pad: the label above, the figure
   stamped below in the figures face. No icon pill — the number IS the
   signifier. */
function Stat({ value, label }: StatProps) {
  return (
    <div className="sheet flex flex-1 flex-col gap-2 p-5">
      <span className="text-2xs font-semibold tracking-[0.06em] text-muted">
        {label}
      </span>
      <span className="font-figures text-3xl font-semibold leading-none text-ink">
        {value}
      </span>
    </div>
  );
}

interface MyCollabBoardProps {
  projects: MyCollabProject[];
}

/**
 * Board: 4 status columns + a stats row. Search/sort/filter apply across all
 * columns at once (a match in any column still shows in its own column).
 * Empty columns get a muted hint.
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

  // Stats are always computed from the FULL list, not the filtered one —
  // the numbers describe the user's portfolio, not the current search
  // (PRODUCT.md principle 2: the board is computed, not written).
  const active = projects.filter((p) => p.myStatus !== "complete").length;
  const pending = projects.filter((p) => p.myStatus === "pending").length;
  const complete = projects.filter((p) => p.myStatus === "complete").length;
  const pct =
    projects.length === 0
      ? "0.00%"
      : `${((complete / projects.length) * 100).toFixed(2)}%`;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2 border-b border-ink pb-4">
        <h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-ink">
          Welcome back, {CURRENT_USER.name}
        </h1>
        <p className="text-sm text-muted">See your projects here.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Stat value={String(active)} label="Active Projects" />
        <Stat value={pct} label="Percentage Complete" />
        <Stat value={String(pending)} label="Project Pending" />
        <Stat value={String(complete)} label="Project Complete" />
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MY_COLLAB_CATEGORIES.map((cat) => {
          const items = filtered.filter((p) => p.myStatus === cat.slug);
          const shown = items.slice(0, CARDS_PER_COLUMN);
          const remaining = items.length - shown.length;

          return (
            <section
              key={cat.slug}
              className="flex min-w-0 flex-col gap-4 rounded-lg border border-rule bg-bg/60 p-4"
            >
              {/* Column head: a rule, the label, a mono count. */}
              <div className="flex items-center justify-between gap-2 border-b border-rule pb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name={cat.icon} size={15} className="text-muted" />
                  <span className="truncate text-xs font-semibold text-ink">
                    {cat.boardLabel}
                  </span>
                </span>
                <span className="font-figures flex size-5 shrink-0 items-center justify-center rounded-sm border border-rule text-3xs font-medium text-muted">
                  {items.length}
                </span>
              </div>

              {shown.length === 0 ? (
                <p className="px-1 text-xs text-muted">No projects here yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {shown.map((p) => (
                    <MyCollabCard key={p.id} project={p} variant="board" />
                  ))}
                </div>
              )}

              {remaining > 0 ? (
                <Link
                  href={`/my-collaborations/${cat.slug}`}
                  className="pressable mt-auto flex w-full cursor-pointer items-center justify-center rounded-sm border border-ink py-2 text-xs font-semibold text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  View More ({remaining})
                </Link>
              ) : items.length > 0 ? (
                <Link
                  href={`/my-collaborations/${cat.slug}`}
                  className="pressable mt-auto flex w-full cursor-pointer items-center justify-center rounded-sm border border-rule py-2 text-xs font-medium text-muted hover:border-ink hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  View all
                </Link>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}