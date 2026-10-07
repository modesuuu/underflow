"use client";

import { useMemo, useState, type CSSProperties } from "react";
import clsx from "clsx";
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
const STAGGER_CAP = 11;

/**
 * Search + filter + sort + responsive card grid (Figma "Collaborations" frame).
 * Pipeline: committed search → type filter → status filter → sort.
 *
 * P2 rhythm (revert = delete the `i === 0` span class and the wrapper div →
 * cards go back to being direct grid children):
 * - first card spans 2 columns (featured) from sm up;
 * - one-shot mount stagger (50ms/item, CSS-gated behind reduced motion).
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

  return (
    <div className="flex flex-col gap-6">
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

      {filtered.length === 0 ? (
        /* P2 #12: proper empty view instead of a blank area */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={40} className="text-placeholder" />
          <p className="text-lg font-medium text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            Adjust your search or filters — or create a project and be the
            first to show up here.
          </p>
        </div>
      ) : (
        /* Card grid — columns owned by the grid, card is responsive.
           The wrapper div carries the stagger + rhythm; CollabCard itself is
           untouched (revert-friendly). */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project, i) => (
            <div
              key={project.id}
              className={clsx("card-stagger", i === 0 && "sm:col-span-2")}
              style={{ "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties}
            >
              <CollabCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
