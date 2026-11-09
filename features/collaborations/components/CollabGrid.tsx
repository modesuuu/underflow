"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { CollabCard } from "./CollabCard";
import { sortProjects } from "../sort";
import type { CollabProject } from "../types";
import {
  clearToolbar,
  hasActiveFilters,
  useCollabToolbar,
} from "../toolbar-store";

interface CollabGridProps {
  projects: CollabProject[];
}

/** Cap the stagger index so late cards don't wait a full second in. */
const STAGGER_CAP = 8;

/** Cards per page of the river; "Show more" grows it in place. */
const PAGE_SIZE = 12;

/**
 * Search + type filter + responsive card grid (Figma "Collaborations" frame).
 * Pipeline: committed search → type filter → default order.
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
  // Toolbar state lives in the shared store — the controls render
  // in the TopBar (AppShell actions) while this grid consumes them.
  // Draft query is typed in the input; committed only on Search
  // click / Enter.
  const toolbar = useCollabToolbar();
  const { query, typeFilter } = toolbar;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Each visit starts fresh, as when the state was local to this
  // component — otherwise the store would keep the last search
  // across navigations.
  useEffect(() => () => clearToolbar(), []);

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

    // Default order (the sort control was deleted 2026-11-09).
    return sortProjects(result, "recommended");
  }, [projects, query, typeFilter]);

  // Any change to the result set restarts the river at one page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, typeFilter]);

  const clearAll = clearToolbar;

  const visibleProjects = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6">
      {/* The search/sort/filter controls + New Project live in the
          TopBar now (user order 2026-11-09); the one-click reset
          stays here, above the river, while anything is active. */}
      {hasActiveFilters(toolbar) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-sm font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search & filters
          </button>
        </div>
      )}

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
