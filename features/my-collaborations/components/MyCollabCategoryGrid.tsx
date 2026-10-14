"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { sortMyProjects } from "../sort";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";
import type { MyCollabProject } from "../types";
import { MyCollabRow } from "./MyCollabRow";
import { MyCollabSearchBar } from "./MyCollabSearchBar";

/** Cap the stagger index so late rows don't wait a full second in. */
const STAGGER_CAP = 11;

interface MyCollabCategoryGridProps {
  projects: MyCollabProject[];
}

/**
 * Category page body: the same dense rows the board's
 * sections use, in the same family container — one language
 * across board and category. Search + sort + type-filter
 * pipeline is unchanged; a results line with a clear action
 * and a composed empty state match the board's behavior.
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

  const searching = query.trim() !== "" || typeFilter !== "all";

  const clearAll = () => {
    setDraftQuery("");
    setQuery("");
    setTypeFilter("all");
  };

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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-bg px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface">
            <Icon name="search" size={20} className="text-muted" />
          </span>
          <p className="text-base font-semibold text-ink">No projects match</p>
          <p className="max-w-sm text-sm text-muted">
            No projects in this category match your search and filters.
            Clear them to see all projects in this category.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="pressable mt-2 cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{filtered.length}</span>{" "}
              project{filtered.length === 1 ? "" : "s"}
              {searching && <> of {projects.length}</>}
            </p>
            {searching && (
              <button
                type="button"
                onClick={clearAll}
                className="cursor-pointer text-[13px] font-medium text-ink underline decoration-placeholder underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Clear search &amp; filters
              </button>
            )}
          </div>
          <div className="flex flex-col divide-y divide-placeholder rounded-2xl bg-bg px-4">
            {filtered.map((project, i) => (
              <div
                key={project.id}
                className="card-stagger"
                style={
                  {
                    "--stagger-i": String(Math.min(i, STAGGER_CAP)),
                  } as CSSProperties
                }
              >
                <MyCollabRow project={project} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
