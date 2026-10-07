"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MakeCollabModal } from "./MakeCollabModal";

/**
 * Floating "Create Project" button (Penpot top-bar Frame 466) + modal mount.
 * Lives here so the page.tsx stays a Server Component.
 */
export function MakeCollabTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Fixed bottom-right FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex cursor-pointer items-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-medium text-ink shadow-lg transition-opacity hover:opacity-85"
      >
        <Icon name="plus" size={16} />
        Create Project
      </button>

      <MakeCollabModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}