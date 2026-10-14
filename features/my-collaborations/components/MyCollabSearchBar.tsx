"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import type {
  CollabFilterType,
  CollabSortKey,
} from "@/features/collaborations/types";

const TYPE_OPTIONS: { value: CollabFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "coursework", label: "Coursework" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
];

const SORT_OPTIONS: { value: CollabSortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "due", label: "Due soonest" },
  { value: "newest", label: "Newest" },
];

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

/**
 * Dropdown with outside-click / Escape close + aria state. The
 * trigger span owns the toggle (the trigger button itself is
 * presentational); a click inside the panel on an element with
 * data-close-panel closes it.
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
      >
        {trigger}
      </span>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-line bg-surface p-3 shadow-lg"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest("[data-close-panel]")) {
              setOpen(false);
            }
          }}
        >
          {panel}
        </div>
      )}
    </div>
  );
}

interface MyCollabSearchBarProps {
  draftQuery: string;
  onDraftChange: (q: string) => void;
  onSearch: () => void;
  sortKey: CollabSortKey;
  onSortChange: (s: CollabSortKey) => void;
  typeFilter: CollabFilterType;
  onTypeChange: (t: CollabFilterType) => void;
}

/**
 * Search + sort + type-filter bar for My Collaborations (board &
 * category). Search-first like the public board: the search group
 * leads and widens, sort and filter are labeled buttons that say
 * what they hold. Status is not a filter here — it is the
 * section/category structure itself. All controls work.
 */
export function MyCollabSearchBar({
  draftQuery,
  onDraftChange,
  onSearch,
  sortKey,
  onSortChange,
  typeFilter,
  onTypeChange,
}: MyCollabSearchBarProps) {
  const activeFilterCount = typeFilter !== "all" ? 1 : 0;
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search leads */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 transition-shadow focus-within:ring-2 focus-within:ring-accent">
          <Icon name="search" size={18} className="shrink-0 text-muted" />
          <input
            type="text"
            value={draftQuery}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
          />
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
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="pressable h-11 shrink-0 cursor-pointer rounded-xl bg-accent px-4 text-sm font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Search
        </button>
      </div>

      {/* Labeled sort + filter */}
      <div className="ms-auto flex items-center gap-2">
        <Dropdown
          trigger={
            <button
              type="button"
              aria-haspopup="true"
              className="pressable flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-bg px-3.5 text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="sort" size={18} />
              <span className="hidden sm:inline">{sortLabel}</span>
              <Icon name="chevron-down" size={16} className="text-muted" />
            </button>
          }
          panel={
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Sort by</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-close-panel
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
              aria-haspopup="true"
              className="pressable relative flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-bg px-3.5 text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="filter" size={18} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-badge text-2xs font-semibold text-surface">
                  {activeFilterCount}
                </span>
              )}
            </button>
          }
          panel={
            <PillGroup
              legend="Type"
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={onTypeChange}
            />
          }
        />
      </div>
    </div>
  );
}
