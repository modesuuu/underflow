"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@/components/ui/Icon";
import type { CollabSortKey } from "@/features/collaborations/types";

const SORT_OPTIONS: { value: CollabSortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "due", label: "Due soonest" },
  { value: "newest", label: "Newest" },
];

/**
 * Dropdown with outside-click / Escape close + aria state. The
 * trigger span owns the toggle (the trigger button itself is
 * presentational); a click inside the panel on an element with
 * data-close-panel closes it.
 */
export function Dropdown({
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
}

/**
 * Search + sort bar for the My Collaborations category pages.
 * Search-first like the public board: the search group
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
}: MyCollabSearchBarProps) {
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort";

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

      {/* Labeled sort + filter */}
      <div className="ms-auto flex items-center gap-2">
        <Dropdown
          trigger={
            <button
              type="button"
              aria-haspopup="true"
              className="pressable flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-bg px-3.5 text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
                      ? "bg-accent font-medium text-on-accent"
                      : "text-ink hover:bg-bg"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
}
