"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { MyCollabProject } from "../types";
import { KanbanCard } from "./KanbanCard";
import { MyCollabSearchBar } from "./MyCollabSearchBar";

interface MyCollabCategoryGridProps {
  projects: MyCollabProject[];
  /** Global pastel offset for this category (the board's column
      startIndex), so a project keeps its board tint here. */
  startIndex: number;
}

/**
 * Category page body: the same Kanban cards as the board, in a
 * flat responsive grid — no columns (the page IS one category)
 * and no borders (the cards are borderless pastels, like the
 * board's). Search filters by title/subtitle; the grid keeps
 * the board's incoming order (no sort control — removed at the
 * user's order, 2026-11-13).
 * A results line with a clear action and a composed empty state
 * match the board's behavior.
 */
export function MyCollabCategoryGrid({
  projects,
  startIndex,
}: MyCollabCategoryGridProps) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");

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
    return result;
  }, [projects, query]);

  const searching = query.trim() !== "";

  const clearAll = () => {
    setDraftQuery("");
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-6">
      <MyCollabSearchBar
        draftQuery={draftQuery}
        onDraftChange={setDraftQuery}
        onSearch={() => setQuery(draftQuery)}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-bg px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface">
            <Icon name="search" size={20} className="text-muted" />
          </span>
          <p className="text-base font-semibold text-ink">No projects match</p>
          <p className="max-w-sm text-sm text-muted">
            No projects in this category match your search.
            Clear it to see all projects in this category.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="pressable mt-2 cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-3">
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
                Clear search
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((project, i) => (
              <KanbanCard
                key={project.id}
                project={project}
                index={startIndex + i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
