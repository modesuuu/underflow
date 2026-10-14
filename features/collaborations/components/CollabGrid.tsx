"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProjectBand } from "./ProjectBand";
import { SearchFilterBar } from "./SearchFilterBar";
import { parseDueDate, sortProjects } from "../sort";
import type {
  CollabFilterType,
  CollabProject,
  CollabSortKey,
  CollabStatusFilter,
} from "../types";

interface CollabGridProps {
  projects: CollabProject[];
}

/** Cap the stagger index so late cards don't wait a full second in. */
const STAGGER_CAP = 11;

/** Bands per page of the river; "Show more" grows it in place. */
const PAGE_SIZE = 12;

type QuickView = "all" | "open" | "ending" | "almost-full" | "saved";

const QUICK_VIEWS: { id: QuickView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open seats" },
  { id: "ending", label: "Ending soon" },
  { id: "almost-full", label: "Almost full" },
  { id: "saved", label: "Saved" },
];

/**
 * Search + filter + sort + responsive card grid (Figma "Collaborations" frame).
 * Pipeline: committed search → type filter → status filter → sort.
 *
 * 2026 redesign v3: a river of self-complete bands, built for
 * a board that grows like a feed — sticky tools, quick views
 * and skill facets to cut the list, a shortlist (Saved), and
 * show-more pagination instead of one endless render. Mount
 * stagger unchanged (50ms per item, reduced-motion gated).
 *
 * No positional numbering: this is a filterable/sortable/searchable data
 * grid — index numbers reshuffle on every interaction and imply a ranking
 * that doesn't exist.
 */
export function CollabGrid({ projects }: CollabGridProps) {
  // Draft query is typed in the input; committed only on Search click / Enter.
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<CollabSortKey>("recommended");
  const [typeFilter, setTypeFilter] = useState<CollabFilterType>("all");
  const [statusFilter, setStatusFilter] = useState<CollabStatusFilter>("all");
  const [quickView, setQuickView] = useState<QuickView>("all");
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let result = projects;

    // Search: case-insensitive match on title/subtitle/description
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Quick view — the triage cuts for a long board
    if (quickView === "open") {
      result = result.filter(
        (p) => p.status === "open" && p.slotsFilled < p.slotsTotal
      );
    } else if (quickView === "ending") {
      const horizon = Date.now() + 21 * 24 * 60 * 60 * 1000;
      result = result.filter((p) => {
        const due = parseDueDate(p.dueDate);
        return p.status !== "completed" && due !== Infinity && due <= horizon;
      });
    } else if (quickView === "almost-full") {
      result = result.filter(
        (p) =>
          p.slotsFilled < p.slotsTotal &&
          p.slotsFilled / p.slotsTotal >= 0.75
      );
    } else if (quickView === "saved") {
      result = result.filter((p) => savedIds.has(p.id));
    }

    // Skill facet — the relevance cut
    if (skillFilter) {
      result = result.filter((p) =>
        p.skills.some((sk) => sk.label === skillFilter)
      );
    }

    // Deterministic sort (no Date.parse for two-digit years)
    return sortProjects(result, sortKey);
  }, [projects, query, typeFilter, statusFilter, sortKey, quickView, skillFilter, savedIds]);

  // Any change to the result set restarts the river at one page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, typeFilter, statusFilter, sortKey, quickView, skillFilter]);

  // Facets from the data itself: the skills this board asks for.
  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const sk of p.skills) {
        counts.set(sk.label, (counts.get(sk.label) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [projects]);

  const toggleSaved = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearAll = () => {
    setDraftQuery("");
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setQuickView("all");
    setSkillFilter(null);
  };

  const visibleProjects = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6">
      {/* Tools stick under the TopBar — on a long board, search
          and facets stay reachable mid-scroll. */}
      <div className="sticky top-[79px] z-10 border-b border-placeholder bg-surface pb-3">
        <SearchFilterBar
          draftQuery={draftQuery}
          onDraftChange={setDraftQuery}
          onSearch={() => setQuery(draftQuery)}
          sortKey={sortKey}
          onSortChange={setSortKey}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Facets: quick views, then the board's most-asked skills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3">
          {QUICK_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setQuickView(view.id)}
              aria-pressed={quickView === view.id}
              className={
                quickView === view.id
                  ? "cursor-pointer rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-surface transition-colors"
                  : "cursor-pointer rounded-full bg-bg px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
              }
            >
              {view.label}
              {view.id === "saved" && savedIds.size > 0 && (
                <span className="text-subtle"> · {savedIds.size}</span>
              )}
            </button>
          ))}
          {topSkills.length > 0 && (
            <span className="mx-1.5 h-5 w-px bg-placeholder" aria-hidden="true" />
          )}
          {topSkills.map(([label, count]) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                setSkillFilter((cur) => (cur === label ? null : label))
              }
              aria-pressed={skillFilter === label}
              className={
                skillFilter === label
                  ? "cursor-pointer rounded-full bg-bg px-3 py-1.5 text-[13px] font-semibold text-ink ring-1 ring-ink transition-colors"
                  : "cursor-pointer rounded-full bg-bg px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
              }
            >
              {label} <span className="text-subtle">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results line — the count is real, and a filtered view can
          be cleared from here (and from the empty state). */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "project" : "projects"}
          {(query.trim() !== "" ||
            typeFilter !== "all" ||
            statusFilter !== "all" ||
            quickView !== "all" ||
            skillFilter !== null) && <> of {projects.length}</>}
        </p>
        {(query.trim() !== "" ||
          typeFilter !== "all" ||
          statusFilter !== "all" ||
          quickView !== "all" ||
          skillFilter !== null) && (
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-sm font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search & filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        /* P2 #12: proper empty view instead of a blank area */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={40} className="text-placeholder" />
          <p className="text-lg font-medium text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            Nothing matches that search and filter set. Clear them to see
            every project again.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="pressable mt-1 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search & filters
          </button>
        </div>
      ) : (
        /* The river: self-complete bands, one page at a time. */
        <>
          <div className="flex flex-col gap-3">
            {visibleProjects.map((project, i) => (
              <div
                key={project.id}
                className="card-stagger"
                style={
                  { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties
                }
              >
                <ProjectBand
                  project={project}
                  saved={savedIds.has(project.id)}
                  onToggleSaved={() => toggleSaved(project.id)}
                />
              </div>
            ))}
          </div>
          {filtered.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="pressable cursor-pointer rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Show more projects ({filtered.length - visibleCount} more)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
