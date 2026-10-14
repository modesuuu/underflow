"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProjectIndexRow } from "./ProjectIndexRow";
import { ProjectPreview } from "./ProjectPreview";
import { SearchFilterBar } from "./SearchFilterBar";
import { useRouter } from "next/navigation";
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
 * 2026 redesign v2: an index + preview split instead of a card
 * grid (the works-index pattern from award-winning portfolio
 * sites, adapted for an app), a one-shot mount stagger (50ms
 * per item, CSS-gated behind reduced motion), and a results
 * line that can clear the filter state.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

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

  // The preview follows the selection; a filter change that
  // drops the selected project falls back to the first result.
  const selected =
    filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  const handleSelect = (project: CollabProject) => {
    // Below lg there is no preview pane — the tap goes to the detail.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      router.push(`/collaborations/${project.id}`);
      return;
    }
    setSelectedId(project.id);
  };

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

      {/* Results line — the count is real, and a filtered view can
          be cleared from here (and from the empty state). */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "project" : "projects"}
          {(query.trim() !== "" ||
            typeFilter !== "all" ||
            statusFilter !== "all") && <> of {projects.length}</>}
        </p>
        {(query.trim() !== "" ||
          typeFilter !== "all" ||
          statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setDraftQuery("");
              setQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
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
            onClick={() => {
              setDraftQuery("");
              setQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
            className="pressable mt-1 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search & filters
          </button>
        </div>
      ) : (
        /* Index + preview split: hairline rows carry the
           scanning facts; the sticky pane holds the selected
           project's brief, so comparing never leaves the page. */
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4 px-3 pb-2 text-[11px] font-medium text-subtle">
              <span className="flex-1">Project</span>
              <span className="hidden w-24 text-right sm:block">Seats</span>
              <span className="hidden w-14 text-right md:block">Due</span>
              <span className="w-[18px]" aria-hidden="true" />
            </div>
            <div className="flex flex-col divide-y divide-placeholder border-y border-placeholder">
              {filtered.map((project, i) => (
                <div
                  key={project.id}
                  className="card-stagger"
                  style={
                    { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties
                  }
                >
                  <ProjectIndexRow
                    project={project}
                    selected={selected?.id === project.id}
                    onSelect={() => handleSelect(project)}
                  />
                </div>
              ))}
            </div>
          </div>
          {selected && (
            <aside className="sticky top-8 hidden max-h-[calc(100dvh-9rem)] w-[380px] shrink-0 flex-col overflow-hidden rounded-2xl bg-bg lg:flex">
              <ProjectPreview project={selected} />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
