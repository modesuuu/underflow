"use client";

import { useMemo, useState } from "react";
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

/**
 * Search + filter + sort + responsive card grid (Figma "Collaborations" frame).
 * Pipeline: committed search → type filter → status filter → sort.
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

      {/* Card grid — columns owned by the grid, card is responsive */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((project) => (
          <CollabCard key={project.id} project={project} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted">
          No projects found. Try a different search or filter.
        </p>
      )}
    </div>
  );
}
