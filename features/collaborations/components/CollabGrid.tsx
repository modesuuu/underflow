"use client";

import { useMemo, useState } from "react";
import { CollabCard } from "./CollabCard";
import { SearchFilterBar } from "./SearchFilterBar";
import type { CollabFilterType, CollabProject } from "../types";

interface CollabGridProps {
  projects: CollabProject[];
}

/**
 * Search + filter + responsive card grid (Penpot "Collaborations" Frame 492).
 * Functional filtering against mock data; swap to API params when backend lands.
 */
export function CollabGrid({ projects }: CollabGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<CollabFilterType>("all");

  const filtered = useMemo(() => {
    let result = projects;
    if (activeType !== "all") {
      result = result.filter((p) => p.type === activeType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [projects, searchQuery, activeType]);

  return (
    <div className="flex flex-col gap-6">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      {/* Card grid: 4 columns per Penpot (226px cards, 20px gap) */}
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