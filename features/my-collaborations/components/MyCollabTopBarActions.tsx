"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MyCollabMobileSearchModal } from "./MyCollabMobileSearchModal";
import { setQuery, useMyCollabToolbar } from "../toolbar-store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The /my-collaborations TopBar actions (user order 2026-11-10):
 * the search pill, moved up from the board header into the
 * TopBar — same pattern as /collaborations. Wired to the shared
 * toolbar store; the Kanban board reads the same state and
 * filters live as you type.
 *
 * Mobile: below `sm` the pill is replaced by a search icon
 * button; tapping it slides the mobile search sheet in from
 * the right (MyCollabMobileSearchModal).
 */
export function MyCollabTopBarActions() {
  const { t } = useLanguage();
  const { query } = useMyCollabToolbar();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-3">
      {/* Search pill — desktop only (hidden below sm). */}
      <div className="hidden w-72 sm:block">
        <div className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 focus-within:ring-2 focus-within:ring-accent">
          <Icon name="search" size={18} className="shrink-0 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("collab.searchProjectsLabel")}
            aria-label={t("collab.searchProjectsLabel")}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
          />
          {query !== "" && (
            <button
              type="button"
              aria-label={t("collab.clearSearch")}
              onClick={() => setQuery("")}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bg text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>
      {/* Search icon — phones only (opens the search sheet). */}
      <button
        type="button"
        aria-label={t("common.search")}
        onClick={() => setMobileSearchOpen(true)}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden"
      >
        <Icon name="search" size={20} />
      </button>
      <MyCollabMobileSearchModal
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />
    </div>
  );
}
