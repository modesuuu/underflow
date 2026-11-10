"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PostModal } from "@/features/dashboard/components/PostModal";

/**
 * The "+ Post Something" header button. Feeds passes it explicitly to
 * AppShell's `actions` slot — it is NOT a TopBar default anymore.
 * Each instance owns its composer modal state; only one instance is
 * visible per breakpoint (desktop button vs mobile FAB).
 */
export function PostButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="plus" size={16} />
        <span className="text-sm font-medium">Post Something</span>
      </button>
      <PostModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
