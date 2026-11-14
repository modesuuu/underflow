"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { getCollabProjects } from "../api";
import {
  commitSearch,
  setDraftQuery,
  useCollabToolbar,
} from "../toolbar-store";
import type { CollabProject } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Mobile search sheet (user order 2026-11-09, reference image-24):
 * below `sm` the TopBar search pill is replaced by a search icon; tapping
 * it slides this sheet in from the right. The sheet mirrors the reference:
 * a search input up top (back + clear) and suggestions — popular searches
 * when empty, live matches while typing. Tapping a project opens its
 * detail; Enter (or a popular term) commits the project search and
 * closes the sheet. Projects come from the real API (no people search
 * endpoint exists yet, so the sheet is projects-only).
 */

interface MobileSearchModalProps {
  open: boolean;
  onClose: () => void;
}

function matchesProject(p: CollabProject, q: string): boolean {
  const hay =
    `${p.title} ${p.subtitle} ${p.description}`.toLowerCase();
  return hay.includes(q);
}

export function MobileSearchModal({ open, onClose }: MobileSearchModalProps) {
  const { t } = useLanguage();
  const { draftQuery } = useCollabToolbar();
  const [projects, setProjects] = useState<CollabProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Exit animation state — the sheet stays mounted until the CSS
  // out-animation finishes (same pattern as MakeCollabModal).
  useEffect(() => {
    if (open) setClosing(false);
  }, [open ]);

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
  }, [open ]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // Load the real project list when the sheet opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getCollabProjects()
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
  }, [open ]);

  const requestClose = () => {
    setClosing(true);
    onClose();
    previousFocusRef.current?.focus?.();
  };

  const q = draftQuery.trim().toLowerCase();

  // Popular searches: the project titles — every one is a term the grid
  // actually matches (the grid filters title/subtitle/description only),
  // so tapping one always lands on a real result.
  const popular = useMemo(() => projects.map((p) => p.title), [projects]);

  const projectMatches = useMemo(
    () => (q ? projects.filter((p) => matchesProject(p, q)) : []),
    [q, projects]
  );

  if (!open && !closing) return null;

  const commitAndClose = () => {
    commitSearch();
    requestClose();
  };

  const pickPopular = (term: string) => {
    setDraftQuery(term);
    commitSearch();
    requestClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t("common.search")}
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
        {/* Header: back + search input + clear (reference image-24). */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-3">
          <button
            type="button"
            aria-label={t("common.back")}
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
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAndClose();
              }}
              placeholder={t("common.search")}
              aria-label={t("collab.searchProjectsLabel")}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
            {draftQuery && (
              <button
                type="button"
                aria-label={t("collab.clearSearch")}
                onClick={() => setDraftQuery("")}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        </div>


        {/* Suggestions / results. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Loading…
            </p>
          ) : q === "" ? (
            popular.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                No projects yet.
              </p>
            ) : (
              <>
                <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted uppercase">
                  Popular searches
                </p>
                {popular.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => pickPopular(term)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] text-ink transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none"
                  >
                    <Icon
                      name="search"
                      size={18}
                      className="shrink-0 text-muted"
                    />
                    {term}
                  </button>
                ))}
              </>
            )
          ) : projectMatches.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No projects found for &ldquo;{draftQuery.trim()}&rdquo;.
            </p>
          ) : (
            projectMatches.map((p) => (
              <Link
                key={p.id}
                href={`/collaborations/${p.id}`}
                onClick={requestClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none"
              >
                <Avatar alt={p.owner.name} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">
                    {p.title}
                  </span>
                  <span className="block truncate text-[13px] text-muted">
                    {p.owner.name} · {p.owner.role} · {p.type}
                  </span>
                </span>
                <Icon
                  name="chevron-right"
                  size={18}
                  className="shrink-0 text-muted"
                />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
