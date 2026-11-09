"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MakeCollabModal } from "./MakeCollabModal";

/**
 * Right-side header actions for /collaborations (Figma "Collaborations" frame).
 * "+ Create Project" → MakeCollabModal (moved here from the old FAB).
 * The notifications bell lives in the TopBar itself. Settings icon
 * omitted — no settings surface exists.
 *
 * Mobile (user order 2026-11-09): the TopBar button is desktop-only;
 * on phones the same action is a fixed floating button at the
 * bottom-right corner (the TopBar keeps only the search icon + bell,
 * so it fits on one row with the breadcrumb).
 */
export function CollabHeaderActions() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* + New Project — TopBar button (desktop only). */}
      <div className="hidden sm:block">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="pressable flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Icon name="plus" size={16} />
          <span className="text-sm font-medium">New Project</span>
        </button>
      </div>

      {/* + New Project — floating action button (phones only). */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="New Project"
        className="pressable fixed right-4 bottom-4 z-30 flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-surface shadow-lg transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:hidden"
      >
        <Icon name="plus" size={16} />
        <span className="text-sm font-medium">New Project</span>
      </button>

      <MakeCollabModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
