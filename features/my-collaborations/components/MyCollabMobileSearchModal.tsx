"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { getMyCollabProjects } from "../api";
import { setQuery, useMyCollabToolbar } from "../toolbar-store";
import type { MyCollabProject } from "../types";

/**
 * Mobile search sheet for /my-collaborations (user order
 * 2026-11-10: the search moved to the TopBar; below `sm` the
 * pill is replaced by a search icon, and tapping it slides this
 * sheet in from the right — same pattern as the collaborations
 * MobileSearchModal, simplified: no People tab, and the query
 * filters live, so Enter just closes. Tapping a match sets the
 * query to that project title and closes, so the Kanban lands
 * on the one result.
 */

interface MyCollabMobileSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function MyCollabMobileSearchModal({
  open,
  onClose,
}: MyCollabMobileSearchModalProps) {
  const { query } = useMyCollabToolbar();
  const [projects, setProjects] = useState<MyCollabProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Exit animation state — the sheet stays mounted until the CSS
  // out-animation finishes (same pattern as MakeCollabModal).
  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setClosing(false), 200);
    return () => clearTimeout(t);
  }, [closing]);

  // Focus the input on open (opens the keyboard on mobile) and
  // remember the trigger so focus can return on close.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement as HTMLElement | null;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load the real project list when the sheet opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getMyCollabProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const requestClose = () => {
    setClosing(true);
    onClose();
    previousFocusRef.current?.focus?.();
  };

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      q
        ? projects.filter((p) =>
            `${p.title} ${p.subtitle}`.toLowerCase().includes(q)
          )
        : projects,
    [q, projects]
  );

  if (!open && !closing) return null;

  const pickProject = (title: string) => {
    setQuery(title);
    requestClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className={`absolute inset-0 bg-ink/40 ${
          closing ? "modal-overlay-out" : "modal-overlay-in"
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-surface sm:max-w-md ${
          closing ? "sheet-out" : "sheet-in"
        }`}
      >
        {/* Header: back + search input + clear. */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-3">
          <button
            type="button"
            aria-label="Back"
            onClick={requestClose}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon name="chevron-left" size={22} />
          </button>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-bg pl-4 pr-1.5">
            <Icon name="search" size={18} className="shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") requestClose();
              }}
              placeholder="Search projects"
              aria-label="Search projects"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Matches — every project when empty, live matches while typing. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted uppercase">
            {q === "" ? "Your projects" : "Matches"}
          </p>
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Loading…
            </p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No projects found for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProject(p.title)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none"
              >
                <Icon
                  name="search"
                  size={18}
                  className="shrink-0 text-muted"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">
                    {p.title}
                  </span>
                  <span className="block truncate text-[13px] text-muted">
                    {p.subtitle}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
