"use client";

import { CollabHeaderActions } from "./CollabHeaderActions";
import { SearchFilterBar } from "./SearchFilterBar";
import {
  commitSearch,
  setDraftQuery,
  setSortKey,
  setStatusFilter,
  setTypeFilter,
  useCollabToolbar,
} from "../toolbar-store";

/**
 * The /collaborations TopBar actions (user order 2026-11-09): the
 * search/sort/filter controls + the New Project button, moved up
 * from the page toolbar into the TopBar. Wired to the shared
 * toolbar store — the grid reads the same state. The row wraps on
 * narrow screens (the TopBar grows to two rows) so nothing clips.
 */
export function CollabTopBarActions() {
  const { draftQuery, sortKey, typeFilter, statusFilter } = useCollabToolbar();

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <SearchFilterBar
        className="min-w-0 flex-1"
        draftQuery={draftQuery}
        onDraftChange={setDraftQuery}
        onSearch={commitSearch}
        sortKey={sortKey}
        onSortChange={setSortKey}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <CollabHeaderActions />
    </div>
  );
}
