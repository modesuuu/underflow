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
      <legend className="text-xs font-semibold text-ink">{legend}</legend>
      <div className="flex flex-col">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm text-ink transition-colors hover:bg-bg"
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

/**
 * Dropdown with outside-click / Escape close + aria state. The
 * trigger span owns the toggle (the previous version rendered a
 * trigger that never opened — the click had no handler). A panel
 * marked data-close-panel closes when an option inside is picked.
 */
function Dropdown({
  trigger,
  panel,
}: {
  trigger: ReactNode;
  panel: ReactNode;
}) {
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
  }, [open ]);

  return (
    <div className="relative">
      <span
        ref={triggerRef}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="block"
      >
        {trigger}
      </span>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("[data-close-panel]")) {
              setOpen(false);
            }
          }}
          className="absolute top-full right-0 z-50 mt-2 min-w-[180px] rounded-xl border border-line bg-surface p-2 shadow-[0_16px_40px_-12px_rgba(17,17,17,0.25)]"
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

const TRIGGER_CHROME =
  "pressable flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3.5 transition-colors hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

/**
 * Search + sort + filter bar, 2026 redesign: search leads (the
 * page's job is finding a project), the sort and filter triggers
 * are labeled buttons instead of bare icons, and the search
 * commits on Enter or the Search button, as before.
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
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search — the primary tool on this page */}
      <div className="flex h-11 min-w-52 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-4 transition-colors focus-within:border-ink/40 sm:max-w-md">
        <Icon name="search" size={18} className="shrink-0 text-muted" />
        <input
          type="text"
          value={draftQuery}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="Search projects…"
          aria-label="Search projects"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
        />
        {draftQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onDraftChange("")}
            className="shrink-0 cursor-pointer text-muted transition-colors hover:text-ink"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="pressable h-11 cursor-pointer rounded-xl bg-accent px-5 text-sm font-semibold text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Search
      </button>

      {/* Sort + filter, labeled */}
      <div className="ms-auto flex items-center gap-2">
        <Dropdown
          trigger={
            <button type="button" aria-label="Sort" className={TRIGGER_CHROME}>
              <Icon name="sort" size={18} className="text-ink" />
              <span className="text-sm font-medium text-ink">{sortLabel}</span>
              <Icon name="chevron-down" size={16} className="text-muted" />
            </button>
          }
          panel={
            <div className="flex flex-col" data-close-panel>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSortChange(opt.value)}
                  className={clsx(
                    "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                    sortKey === opt.value
                      ? "font-medium text-ink"
                      : "text-muted hover:bg-bg hover:text-ink",
                  )}
                >
                  {opt.label}
                  {sortKey === opt.value && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          }
        />
        <Dropdown
          trigger={
            <button type="button" aria-label="Filter" className={TRIGGER_CHROME}>
              <Icon name="filter" size={18} className="text-ink" />
              <span className="text-sm font-medium text-ink">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex size-[18px] items-center justify-center rounded-full bg-badge text-[11px] font-semibold text-surface">
                  {activeFilterCount}
                </span>
              )}
              <Icon name="chevron-down" size={16} className="text-muted" />
            </button>
          }
          panel={
            <div className="flex min-w-52 flex-col gap-4 p-2">
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
    </div>
  );
}
