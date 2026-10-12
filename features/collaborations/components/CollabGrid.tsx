"use client";

import { useMemo, useState } from "react";
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

/**
 * Search + filter + sort + responsive card grid.
 * Pipeline: committed search → type filter → status filter → sort.
 * No positional numbering in the card — the grid reranks on every interaction,
 * so an entry number here would imply a ranking that does not exist.
 */
export function CollabGrid({ projects }: CollabGridProps) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<CollabSortKey>("recommended");
  const [typeFilter, setTypeFilter] = useState<CollabFilterType>("all");
  const [statusFilter, setStatusFilter] = useState<CollabStatusFilter>("all");

  const filtered = useMemo(() => {
    let result = projects;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") result = result.filter((p) => p.type === typeFilter);
    if (statusFilter !== "all")
      result = result.filter((p) => p.status === statusFilter);

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
        /* Empty state = an invitation to act, in the interface's voice. */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={36} className="text-subtle" />
          <p className="text-lg font-semibold text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            Adjust your search or filters — or create a project and be the
            first to show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project, i) => (
            <CollabCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}