"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { sortMyProjects } from "../sort";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";
import type { MyCollabProject } from "../types";
import { MyCollabCard } from "./MyCollabCard";
import { MyCollabSearchBar } from "./MyCollabSearchBar";

/** Cap the stagger index so late cards don't wait a full second in. */
const STAGGER_CAP = 11;

interface MyCollabCategoryGridProps {
  projects: MyCollabProject[];
}

/**
 * Category grid (frame 2): every entry of one myStatus category, in the same
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

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <MyCollabSearchBar
          draftQuery={draftQuery}
          onDraftChange={setDraftQuery}
          onSearch={() => setQuery(draftQuery)}
          sortKey={sortKey}
          onSortChange={setSortKey}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
        />
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={40} className="text-placeholder" />
          <p className="text-lg font-medium text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            Adjust your search or filters — your projects will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MyCollabSearchBar
        draftQuery={draftQuery}
        onDraftChange={setDraftQuery}
        onSearch={() => setQuery(draftQuery)}
        sortKey={sortKey}
        onSortChange={setSortKey}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((project, i) => (
          <div
            key={project.id}
            className="card-stagger"
            style={{ "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties}
          >
            <MyCollabCard project={project} variant="category" />
          </div>
        ))}
      </div>
    </div>
  );
}
