"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { sortMyProjects } from "../sort";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";
import type { MyCollabProject } from "../types";
import { MyCollabCard } from "./MyCollabCard";
import { MyCollabSearchBar } from "./MyCollabSearchBar";

interface MyCollabCategoryGridProps {
  projects: MyCollabProject[];
}

/**
 * Category grid: every entry of one myStatus category, in the same
 * search + sort + type-filter pipeline as the public grid. Category cards show
 * the project status row (the board columns don't, since they're already
 * status-scoped).
 */
export function MyCollabCategoryGrid({ projects }: MyCollabCategoryGridProps) {
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

  const searchBar = (
    <MyCollabSearchBar
      draftQuery={draftQuery}
      onDraftChange={setDraftQuery}
      onSearch={() => setQuery(draftQuery)}
      sortKey={sortKey}
      onSortChange={setSortKey}
      typeFilter={typeFilter}
      onTypeChange={setTypeFilter}
    />
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {searchBar}
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={36} className="text-subtle" />
          <p className="text-lg font-semibold text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            Adjust your search or filters — your projects will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {searchBar}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((project) => (
          <MyCollabCard key={project.id} project={project} variant="category" />
        ))}
      </div>
    </div>
  );
}