"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  markThreadUnread,
  toggleMuteThread,
  togglePinThread,
} from "../store";
import type { Conversation } from "../types";

interface ThreadOptionsMenuProps {
  thread: Conversation;
  /** Open upward when the row sits near the bottom of the list. */
  dropUp?: boolean;
  onClearRequest: (thread: Conversation) => void;
  onDeleteRequest: (thread: Conversation) => void;
}

/**
 * The kebab menu on a conversation row — the thread-level actions
 * (the Figma modal next to 386:5 is the design reference). Pin,
 * mute and mark-unread apply instantly; Clear and Delete are
 * destructive, so they hand up to the column's confirmation dialog.
 * Closes on outside click and on Escape (same pattern as the feed's
 * PostOptionsMenu).
 */
export function ThreadOptionsMenu({
  thread,
  dropUp = false,
  onClearRequest,
  onDeleteRequest,
}: ThreadOptionsMenuProps) {
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

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-bg";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Options for chat with ${thread.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-ink"
      >
        <Icon name="dots-vertical-rounded" size={24} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`Chat with ${thread.name} — options`}
          className={`absolute right-0 z-30 min-w-52 rounded-xl border border-line bg-surface p-1 shadow-lg ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              togglePinThread(thread.id);
            }}
            className={itemClass}
          >
            <Icon name="pin" size={18} />
            {thread.pinned ? "Unpin chat" : "Pin chat"}
          </button>
          {thread.unread === 0 && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                markThreadUnread(thread.id);
              }}
              className={itemClass}
            >
              <Icon name="envelope" size={18} />
              Mark as unread
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              toggleMuteThread(thread.id);
            }}
            className={itemClass}
          >
            <Icon name={thread.muted ? "bell" : "bell-off"} size={18} />
            {thread.muted ? "Unmute notifications" : "Mute notifications"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onClearRequest(thread);
            }}
            className={itemClass}
          >
            <Icon name="brush" size={18} />
            Clear chat
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDeleteRequest(thread);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#ff383c] transition-colors hover:bg-bg"
          >
            <Icon name="trash" size={18} />
            Delete chat
          </button>
        </div>
      )}
    </div>
  );
}
