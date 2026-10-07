"use client";

import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import type { CollabFilterType } from "../types";

const TYPE_OPTIONS: { value: CollabFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "coursework", label: "Coursework" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
];

interface SearchFilterBarProps {
  /** Live search value — parent owns the state. */
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeType: CollabFilterType;
  onTypeChange: (t: CollabFilterType) => void;
}

/**
 * Search + type filter bar (Figma "Collaborations" frame).
 * Live filtering: typing in the search input filters immediately.
 * Sort button deleted — no sort implementation, no decorative controls.
 */
export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  activeType,
  onTypeChange,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: type filter pills */}
      <div className="flex items-center gap-1">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTypeChange(opt.value)}
            className={clsx(
              "cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
              activeType === opt.value
                ? "bg-accent text-ink"
                : "bg-bg text-muted hover:bg-placeholder/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Right: live search input */}
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2">
        <Icon name="search" size={16} className="text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects..."
          aria-label="Search projects"
          className="w-40 bg-transparent text-xs font-medium text-ink outline-none placeholder:text-muted sm:w-52"
        />
      </div>
    </div>
  );
}
