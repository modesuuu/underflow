"use client";

import { useState } from "react";
import { CollabHeaderActions } from "./CollabHeaderActions";
import { MobileSearchModal } from "./MobileSearchModal";
import { SearchFilterBar } from "./SearchFilterBar";
import { Icon } from "@/components/ui/Icon";
import {
  commitSearch,
  setDraftQuery,
  setSortKey,
  useCollabToolbar,
} from "../toolbar-store";

/**
 * The /collaborations TopBar actions (user order 2026-11-09): the
 * search pill (search + sort dropdown) + the New Project button,
 * moved up from the page toolbar into the TopBar. Wired to the
 * shared toolbar store — the grid reads the same state. The row
 * wraps on narrow screens (the TopBar grows to two rows) so
 * nothing clips.
 *
 * Mobile (user order 2026-11-09, reference image-24): below `sm`
 * the pill is replaced by a search icon button; tapping it slides
 * the mobile search sheet in from the right (MobileSearchModal).
 * The sort lives in the pill, so on phones it is desktop-only.
 */
export function CollabTopBarActions() {
  const { draftQuery, sortKey } = useCollabToolbar();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div className="flex min-w-60 flex-1 flex-wrap items-center justify-end gap-3">
      {/* Search pill — desktop only (hidden below sm). */}
      <div className="hidden min-w-60 max-w-md flex-1 sm:block">
        <SearchFilterBar
          draftQuery={draftQuery}
          onDraftChange={setDraftQuery}
          onSearch={commitSearch}
          sortKey={sortKey}
          onSortChange={setSortKey}
        />
      </div>
      {/* Search icon — phones only (opens the search sheet). */}
      <button
        type="button"
        aria-label="Search"
        onClick={() => setMobileSearchOpen(true)}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden"
      >
        <Icon name="search" size={20} />
      </button>
      <CollabHeaderActions />
      <MobileSearchModal
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />
    </div>
  );
}
