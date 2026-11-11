"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { CollabCard } from "./CollabCard";
import { sortProjects } from "../sort";
import type { CollabProject, CollabSortKey } from "../types";
import {
  COLLAB_PAGE_SIZE,
  getCollabProjectsPage,
  type CollabListResult,
} from "../api";
import {
  clearToolbar,
  hasActiveFilters,
  useCollabToolbar,
} from "../toolbar-store";

interface CollabGridProps {
  /** First server-rendered page (page 1, default sort, no search). */
  initial?: CollabListResult;
  /**
   * Fixed client-side list (e.g. one person's projects on their profile
   * page) — no server endpoint pages that subset, so search/sort/slice
   * stay client-side here. The audit allows the client slice where
   * backend pagination is not used. When set, `initial` is ignored.
   */
  clientList?: CollabProject[];
}

/** Cap the stagger index so late cards don't wait a full second in. */
const STAGGER_CAP = 8;

/**
 * Search + sort + responsive card grid (Figma "Collaborations" frame).
 *
 * Search, sort, and pagination all run on the backend (audit P2-12):
 * the toolbar store's committed query + sort key drive
 * GET /api/collab?q&sort&page, and "Show more" fetches the NEXT page
 * and appends — page 1 is never refetched for pagination. There is no
 * client-side filtering or sorting left here.
 *
 * 2026-11-09 redesign: a person-led card grid (CRM reference
 * pattern), built for a board that grows like a feed — sticky
 * tools and show-more pagination instead of one endless render.
 * Mount stagger unchanged (50ms per item, reduced-motion gated).
 *
 * No positional numbering: this is a filterable/sortable/searchable data
 * grid — index numbers reshuffle on every interaction and imply a ranking
 * that doesn't exist.
 */
export function CollabGrid({ initial, clientList }: CollabGridProps) {
  // Toolbar state lives in the shared store — the controls render
  // in the TopBar (AppShell actions) while this grid consumes them.
  // Draft query is typed in the input; committed only on Search
  // click / Enter.
  const toolbar = useCollabToolbar();
  const { query, sortKey } = toolbar;
  // Server-paged mode (/collaborations): the grid accumulates pages.
  const [projects, setProjects] = useState<CollabProject[]>(
    initial?.projects ?? []
  );
  const [total, setTotal] = useState(initial?.pagination.total ?? 0);
  const [page, setPage] = useState(initial?.pagination.page ?? 1);
  const [loadError, setLoadError] = useState(initial?.loadError ?? false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  // The server already rendered page 1 for the default toolbar state;
  // skip the refetch on mount so the first paint is not thrown away.
  const isFirstRender = useRef(true);

  // Client-list mode (profile projects page): the list is fixed, so
  // search/sort/slice run client-side over it (sortProjects sorts by
  // postedAt since Batch 4 — never by the postedAgo label).
  const isClientList = clientList !== undefined;
  const clientFiltered = useMemo(() => {
    if (clientList === undefined) return [];
    let result = clientList;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return sortProjects(result, sortKey);
  }, [clientList, query, sortKey]);
  const [clientVisibleCount, setClientVisibleCount] =
    useState(COLLAB_PAGE_SIZE);
  // Client-list mode: any search/sort change restarts its river at one
  // page. Adjusted during render (the React docs' "adjusting state when
  // a prop changes" pattern) — not in an effect, which the linter
  // forbids for synchronous setState.
  const [clientFilter, setClientFilter] = useState({ query, sortKey });
  if (
    clientFilter.query !== query ||
    clientFilter.sortKey !== sortKey
  ) {
    setClientFilter({ query, sortKey });
    setClientVisibleCount(COLLAB_PAGE_SIZE);
  }

  // Each visit starts fresh, as when the state was local to this
  // component — otherwise the store would keep the last search
  // across navigations.
  useEffect(() => () => clearToolbar(), []);

  /** Page 1 for a query/sort — used by the toolbar effect + Retry. */
  const loadFirstPage = (q: string, sort: CollabSortKey) => {
    setLoadingPage(true);
    setLoadError(false);
    setMoreFailed(false);
    void getCollabProjectsPage({ q, sort, page: 1 })
      .then((result) => {
        setProjects(result.projects);
        setTotal(result.pagination.total);
        setPage(result.pagination.page);
        setLoadError(result.loadError);
      })
      .catch(() => {
        setLoadError(true);
      })
      .finally(() => {
        setLoadingPage(false);
      });
  };

  // Any search/sort change restarts the river at page 1, server-side.
  // Client-list mode has no server pages — its useMemo above re-filters.
  useEffect(() => {
    if (isClientList) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadFirstPage(query, sortKey);
    // loadFirstPage is re-created each render; the effect must only run
    // when the toolbar values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sortKey]);

  const clearAll = clearToolbar;

  /** "Show more": next server page appended (server mode) or one more
   *  client slice revealed (client-list mode — never a server fetch). */
  const showMore = () => {
    if (isClientList) {
      setClientVisibleCount((c) => c + COLLAB_PAGE_SIZE);
      return;
    }
    if (loadingMore) return;
    setLoadingMore(true);
    setMoreFailed(false);
    void getCollabProjectsPage({ q: query, sort: sortKey, page: page + 1 })
      .then((result) => {
        if (result.loadError) {
          setMoreFailed(true);
          return;
        }
        setProjects((prev) => [...prev, ...result.projects]);
        setTotal(result.pagination.total);
        setPage(result.pagination.page);
      })
      .catch(() => {
        setMoreFailed(true);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const visibleProjects = isClientList
    ? clientFiltered.slice(0, clientVisibleCount)
    : projects;
  const remaining = isClientList
    ? Math.max(0, clientFiltered.length - visibleProjects.length)
    : Math.max(0, total - projects.length);

  return (
    <div className="flex flex-col gap-6">
      {/* The search/sort/filter controls + New Project live in the
          TopBar now (user order 2026-11-09); the one-click reset
          stays here, above the river, while anything is active. */}
      {hasActiveFilters(toolbar) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-sm font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search & filters
          </button>
        </div>
      )}

      {loadError ? (
        /* P2 #9: backend down is NOT "No projects found" — a distinct
           error state with a Retry that refetches page 1. */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="error-circle" size={40} className="text-placeholder" />
          <p className="text-lg font-medium text-ink">
            Couldn&apos;t load projects
          </p>
          <p className="max-w-xs text-sm text-muted">
            The server couldn&apos;t be reached. Check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={() => loadFirstPage(query, sortKey)}
            disabled={loadingPage}
            className="pressable mt-1 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {loadingPage ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : loadingPage && visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted">Loading projects…</p>
        </div>
      ) : visibleProjects.length === 0 ? (
        /* P2 #12: proper empty view instead of a blank area */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="search-alt" size={40} className="text-placeholder" />
          <p className="text-lg font-medium text-ink">No projects found</p>
          <p className="max-w-xs text-sm text-muted">
            No projects match your search and filters. Clear them to see
            all projects.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="pressable mt-1 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Clear search & filters
          </button>
        </div>
      ) : (
        /* Person cards in a grid, one page at a time. */
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project, i) => (
              <div
                key={project.id}
                className="card-stagger"
                style={
                  { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties
                }
              >
                <CollabCard project={project} />
              </div>
            ))}
          </div>
          {moreFailed && (
            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <p className="text-sm text-muted">
                Couldn&apos;t load more projects.
              </p>
              <button
                type="button"
                onClick={showMore}
                className="pressable cursor-pointer rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Try again
              </button>
            </div>
          )}
          {remaining > 0 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={showMore}
                disabled={loadingMore}
                className="pressable cursor-pointer rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading…"
                  : `Show more projects (${remaining} more)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
