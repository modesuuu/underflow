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

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ink">
        <Icon name={icon} size={18} className="text-surface" />
      </div>
      <span className="text-[32px] font-extrabold leading-none text-ink">
        {value}
      </span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

interface MyCollabBoardProps {
  projects: MyCollabProject[];
}

/**
 * Board (frame 1): 4 status columns + a stats row. Search/sort/filter apply
 * across all columns at once (a match in any column still shows in its own
 * column). Empty columns get a muted hint.
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
  // the numbers describe the user's portfolio, not the current search.
  const active = projects.filter((p) => p.myStatus !== "complete").length;
  const pending = projects.filter((p) => p.myStatus === "pending").length;
  const complete = projects.filter((p) => p.myStatus === "complete").length;
  const pct =
    projects.length === 0
      ? "0.00%"
      : `${((complete / projects.length) * 100).toFixed(2)}%`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[40px] font-medium leading-[1.02] text-ink">
          Welcome back, {CURRENT_USER.name}
        </h1>
        <p className="text-sm font-medium text-muted">
          See your projects here.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard icon="file" value={String(active)} label="Active Projects" />
        <StatCard icon="check" value={pct} label="Percentage Complete" />
        <StatCard icon="history" value={String(pending)} label="Project Pending" />
        <StatCard icon="check-circle" value={String(complete)} label="Project Complete" />
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
              className="flex min-w-0 flex-col gap-4 rounded-xl bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cat.pillClassName}`}
                >
                  <Icon name={cat.icon} size={14} className="shrink-0" />
                  <span className="truncate">{cat.boardLabel}</span>
                  <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-ink/10 text-2xs font-semibold text-ink">
                    {items.length}
                  </span>
                </span>
                <Link
                  href={`/my-collaborations/${cat.slug}`}
                  aria-label={`View all ${cat.crumbLabel} projects`}
                  className="pressable flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="dots-vertical" size={18} />
                </Link>
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

              {remaining > 0 && (
                <Link
                  href={`/my-collaborations/${cat.slug}`}
                  className="pressable mt-auto flex w-full cursor-pointer items-center justify-center rounded-md bg-accent py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  View More
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
