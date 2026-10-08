"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { MakeCollabModal } from "./MakeCollabModal";

/**
 * Right-side header actions for /collaborations (Figma "Collaborations" frame).
 * Bell → notifications dropdown (extracted to NotificationsBell, shared with
 * /my-collaborations). "+ Create Project" → MakeCollabModal (moved here from
 * the old FAB). Settings icon omitted — no settings surface exists.
 */
export function CollabHeaderActions() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <NotificationsBell />

      {/* + Create Project */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="pressable flex cursor-pointer items-center gap-1 rounded-md bg-accent p-2 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="plus" size={16} />
        <span className="text-sm font-medium">Create Project</span>
      </button>

      <MakeCollabModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
