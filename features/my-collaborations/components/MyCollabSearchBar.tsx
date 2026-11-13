"use client";

import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@/components/ui/Icon";

interface MyCollabSearchBarProps {
  draftQuery: string;
  onDraftChange: (q: string) => void;
  onSearch: () => void;
}

/**
 * Search bar for the My Collaborations category pages. Search
 * only — the sort dropdown was removed at the user's order
 * (2026-11-13); the grid keeps the board's incoming order.
 * Status is not a filter here — it is the section/category
 * structure itself. All controls work.
 */
export function MyCollabSearchBar({
  draftQuery,
  onDraftChange,
  onSearch,
}: MyCollabSearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search leads */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
        <div
          className="min-w-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
        >
          <TextInput
            type="search"
            label="Search projects"
            isLabelHidden
            value={draftQuery}
            onChange={(value) => onDraftChange(value)}
            placeholder="Search projects..."
            startIcon={<Icon name="search" size={18} className="text-muted" />}
          />
        </div>
        {draftQuery !== "" && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onDraftChange("")}
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bg text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="x" size={12} />
          </button>
        )}
        <Button label="Search" variant="primary" onClick={onSearch} />
      </div>
    </div>
  );
}
