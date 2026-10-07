"use client";

import { useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import type { CollabFilterType, ProjectType } from "../types";

const TYPE_OPTIONS: { value: CollabFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "coursework", label: "Coursework" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
];

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeType: CollabFilterType;
  onTypeChange: (t: CollabFilterType) => void;
}

/**
 * Search + filter bar (Penpot "Collaborations" Frame 489).
 * Replaces the Kanban/Timeline/Spreadsheet/Calendar tabs per product spec.
 */
export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  activeType,
  onTypeChange,
}: SearchFilterBarProps) {
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleSearch = () => {
    onSearchChange(inputValue);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: filter + sort icon buttons */}
      <div className="flex items-center gap-2">
        {/* TODO(backend): open filter dropdown / GET /api/collaborations?status= */}
        <button
          type="button"
          aria-label="Filter"
          className="flex size-[42px] cursor-pointer items-center justify-center rounded-sm bg-bg"
        >
          <Icon name="filter" size={20} className="text-ink" />
        </button>
        {/* TODO(backend): toggle sort order / GET /api/collaborations?sort= */}
        <button
          type="button"
          aria-label="Sort"
          className="flex size-[42px] cursor-pointer items-center justify-center rounded-sm bg-bg"
        >
          <Icon name="sort" size={20} className="text-ink" />
        </button>
      </div>

      {/* Right: type filter pills + search input + search button */}
      <div className="flex items-center gap-3">
        {/* Type filter pills */}
        <div className="flex items-center gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTypeChange(opt.value)}
              className={clsx(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeType === opt.value
                  ? "bg-accent text-ink"
                  : "bg-bg text-muted hover:bg-line"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
          <Icon name="search" size={16} className="text-muted" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search"
            className="w-[140px] bg-transparent text-xs font-medium text-ink outline-none placeholder:text-muted"
          />
        </div>

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-85"
        >
          Search
        </button>
      </div>
    </div>
  );
}