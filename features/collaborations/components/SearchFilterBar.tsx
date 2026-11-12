"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Icon } from "@/components/ui/Icon";
import type { CollabSortKey } from "../types";

const SORT_OPTIONS: { value: CollabSortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "due", label: "Due soonest" },
  { value: "newest", label: "Newest" },
];

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
          className="absolute top-full right-0 z-50 mt-2 min-w-[180px] rounded-lg border border-line bg-surface p-2 shadow-[0_16px_40px_-12px_rgba(var(--uf-shadow-rgb),0.25)]"
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
}

/**
 * Search + sort, 2026-11-09 revision (user order, reference
 * image): ONE pill — search icon, "Search" input, divider, sort
 * dropdown — right-aligned in the TopBar next to New Project.
 * The dropdown holds the sort (Recommended / Due soonest /
 * Newest); the type filter it replaced is gone. Enter commits
 * the search. Full width capped at 448px (w-full max-w-md) so
 * the pill sits on the right instead of stretching, and takes
 * the whole row on phones; below sm the sort label hides (sort
 * icon only) so the input stays usable on phones.
 */
export function SearchFilterBar({
  draftQuery,
  onDraftChange,
  onSearch,
  sortKey,
  onSortChange,
}: SearchFilterBarProps) {
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Recommended";

  return (
    <div className="flex w-full max-w-md min-w-60 items-center gap-2">
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
          placeholder="Search"
          startIcon={<Icon name="search" size={18} className="text-muted" />}
        />
      </div>
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
      <Dropdown
        trigger={
          <button
            type="button"
            aria-label="Sort projects"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <span className="flex items-center sm:hidden">
              <Icon name="sort" size={16} className="text-muted" />
            </span>
            <span className="hidden sm:inline">{sortLabel}</span>
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
    </div>
  );
}
