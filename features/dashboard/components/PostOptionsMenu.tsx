"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * The ••• menu on a feed post (header, right side) — same glyph and
 * hitbox as the Profile cards' options buttons. Holds the post-level
 * actions: Report on other people's posts (the parent turns it into
 * the reported state), Delete on your own posts (the parent confirms
 * first). Closes on outside click and on Escape.
 */
export function PostOptionsMenu({
  onReport,
  onEdit,
  onDelete,
}: {
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Post options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
      >
        <Icon name="dots-horizontal-rounded" size={24} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Post options"
          className="absolute top-full right-0 z-30 mt-1 min-w-44 rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          {onReport && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-bg"
            >
              <Icon name="flag" size={18} />
              Report post
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-bg"
            >
              <Icon name="edit" size={18} />
              Edit post
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-badge transition-colors hover:bg-bg"
            >
              <Icon name="trash" size={18} />
              Delete post
            </button>
          )}
        </div>
      )}
    </div>
  );
}
