"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import type {
  CollabFilterType,
  CollabSortKey,
  CollabStatusFilter,
} from "../types";

const TYPE_OPTIONS: { value: CollabFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "coursework", label: "Coursework" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
];

const STATUS_OPTIONS: { value: CollabStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  // Audit P1-A #7: "completed" was missing from the filter union, so
  // completed projects could never be filtered at all.
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS: { value: CollabSortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "due", label: "Due soonest" },
  { value: "newest", label: "Newest" },
];

/** A radio-like pill group inside a dropdown panel. */
function PillGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium text-muted">{legend}</legend>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-ink"
          >
            <input
              type="radio"
              name={legend.toLowerCase().replace(/\s+/g, "-")}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="size-4 accent-[color:var(--uf-accent)]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Dropdown with outside-click / Escape close + aria state. */
function Dropdown({
  trigger,
  panel,
  children,
}: {
  trigger: ReactNode;
  panel: ReactNode;
  children?: never;
}) {
  // (no children — kept for signature clarity)
  void children;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <span ref={triggerRef} aria-haspopup="true" aria-expanded={open}>
        {trigger}
      </span>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-line bg-surface p-3 shadow-lg"
        >
          {panel}
        </div>
      )}
    </div>
  );
}

interface SearchFilterBarProps {
  draftQuery: string;
  onDraftChange: (q: string) => void;
  onSearch: () => void;
  sortKey: CollabSortKey;
  onSortChange: (s: CollabSortKey) => void;
  typeFilter: CollabFilterType;
  onTypeChange: (t: CollabFilterType) => void;
  statusFilter: CollabStatusFilter;
  onStatusChange: (s: CollabStatusFilter) => void;
}

/**
 * Search + sort + filter bar (Figma "Collaborations" frame).
 * Left: sort icon-button + filter icon-button (42px, bg-bg).
 * Right: search input + lime "Search" button (commit on click or Enter).
 * Type pills moved into the filter dropdown — deliberate change.
 */
export function SearchFilterBar({
  draftQuery,
  onDraftChange,
  onSearch,
  sortKey,
  onSortChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
}: SearchFilterBarProps) {
  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: sort + filter icon buttons */}
      <div className="flex items-center gap-2">
        <Dropdown
          trigger={
            <button
              type="button"
              aria-label="Sort"
              aria-haspopup="true"
              onClick={() => {
                /* toggle handled by Dropdown's own state — use a controlled variant below */
              }}
              className="pressable flex size-[42px] cursor-pointer items-center justify-center rounded-sm bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="sort" size={20} className="text-ink" />
            </button>
          }
          panel={
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Sort by</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSortChange(opt.value)}
                  className={clsx(
                    "pressable cursor-pointer rounded px-2 py-1 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                    sortKey === opt.value
                      ? "bg-accent font-medium text-ink"
                      : "text-ink hover:bg-bg"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        />
        <Dropdown
          trigger={
            <button
              type="button"
              aria-label="Filter"
              aria-haspopup="true"
              className="pressable relative flex size-[42px] cursor-pointer items-center justify-center rounded-sm bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="filter" size={20} className="text-ink" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-badge text-2xs font-medium text-surface">
                  {activeFilterCount}
                </span>
              )}
            </button>
          }
          panel={
            <div className="flex flex-col gap-4">
              <PillGroup
                legend="Type"
                options={TYPE_OPTIONS}
                value={typeFilter}
                onChange={onTypeChange}
              />
              <PillGroup
                legend="Status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={onStatusChange}
              />
            </div>
          }
        />
      </div>

      {/* Right: search input + Search button */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2.5">
          <Icon name="search" size={16} className="text-muted" />
          <input
            type="text"
            value={draftQuery}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-40 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted sm:w-56"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="pressable cursor-pointer rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Search
        </button>
      </div>
    </div>
  );
}
