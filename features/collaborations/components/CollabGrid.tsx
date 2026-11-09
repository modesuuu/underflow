"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { CollabCard } from "./CollabCard";
import { SearchFilterBar } from "./SearchFilterBar";
import { sortProjects } from "../sort";
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
const STAGGER_CAP = 8;

/** Cards per page of the river; "Show more" grows it in place. */
const PAGE_SIZE = 12;

/**
 * Search + filter + sort + responsive card grid (Figma "Collaborations" frame).
 * Pipeline: committed search → type filter → status filter → sort.
 *
 * 2026-11-09 redesign: a person-led card grid (CRM reference
 * pattern), built for a board that grows like a feed — sticky
 * tools and show-more pagination instead of one endless render.
 * Mount stagger unchanged (50ms per item, reduced-motion gated).
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

    // Deterministic sort (no Date.parse for two-digit years)
    return sortProjects(result, sortKey);
  }, [projects, query, typeFilter, statusFilter, sortKey]);

  // Any change to the result set restarts the river at one page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, typeFilter, statusFilter, sortKey]);

  const clearAll = () => {
    setDraftQuery("");
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const visibleProjects = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6">
      {/* Tools stick under the TopBar — on a long board, search
          stays reachable mid-scroll. Layer order: z-[15] sits
          between the card contents (z-10 — later in the DOM, so
          they painted over a z-10 toolbar when scrolling) and the
          TopBar (z-20) with its bell dropdown. The toolbar and
          its dropdown panels stay above the cards, below the TopBar. */}
      <div className="sticky top-[79px] z-[15] collab-ground pb-3">
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

        {/* Reset — the section header is gone (user order), so the
            one-click reset lives here while anything is active. */}
        {(query.trim() !== "" ||
          typeFilter !== "all" ||
          statusFilter !== "all") && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer text-sm font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Clear search & filters
            </button>
          </div>
        )}


      </div>

      {filtered.length === 0 ? (
        /* P2 #12: proper empty view instead of a blank area */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={40} className="text-placeholder" />
          <p className="text-lg font-medium text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            No projects match your search and filters. Clear them to see
            all projects.
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
        /* Person cards in a grid, one page at a time. */
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project, i) => (
              <div
                key={project.id}
                className="card-stagger"
                style={
                  { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties
                }
              >
                <CollabCard project={project} />
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
