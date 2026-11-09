"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import type { CollabFilterType } from "../types";

const TYPE_OPTIONS: { value: CollabFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "coursework", label: "Coursework" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
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
          className="absolute top-full right-0 z-50 mt-2 min-w-[180px] rounded-xl border border-line bg-surface p-2 shadow-[0_16px_40px_-12px_rgba(var(--uf-shadow-rgb),0.25)]"
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
  typeFilter: CollabFilterType;
  onTypeChange: (t: CollabFilterType) => void;
}

/**
 * Search + type filter, 2026-11-09 revision (user order, reference
 * image): ONE pill — search icon, "Search" input, divider, type
 * dropdown — in the TopBar. The separate Search button, the sort
 * (Recommended) and the Filters buttons are deleted; Enter commits
 * the search and the type dropdown filters the river by project
 * type. min-w-60 keeps the pill wide enough that New Project wraps
 * below it on phones instead of squeezing the input.
 */
export function SearchFilterBar({
  draftQuery,
  onDraftChange,
  onSearch,
  typeFilter,
  onTypeChange,
}: SearchFilterBarProps) {
  const typeLabel =
    TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? "All";

  return (
    <div className="flex h-11 min-w-60 flex-1 items-center gap-2 rounded-full border border-line bg-surface pl-4 pr-1.5 transition-colors focus-within:border-ink/40 sm:max-w-md">
      <Icon name="search" size={18} className="shrink-0 text-muted" />
      <input
        type="text"
        value={draftQuery}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        placeholder="Search"
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
      <span aria-hidden="true" className="h-6 w-px shrink-0 bg-line" />
      <Dropdown
        trigger={
          <button
            type="button"
            aria-label="Project type"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <span>{typeLabel}</span>
            <Icon name="chevron-down" size={16} className="text-muted" />
          </button>
        }
        panel={
          <div className="flex flex-col" data-close-panel>
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTypeChange(opt.value)}
                className={clsx(
                  "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                  typeFilter === opt.value
                    ? "font-medium text-ink"
                    : "text-muted hover:bg-bg hover:text-ink",
                )}
              >
                {opt.label}
                {typeFilter === opt.value && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}
