"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import {
  markThreadUnread,
  toggleMuteThread,
  togglePinThread,
  unreadCount,
} from "../store";
import type { Conversation } from "../types";

interface ThreadOptionsMenuProps {
  thread: Conversation;
  onClearRequest: (thread: Conversation) => void;
  onDeleteRequest: (thread: Conversation) => void;
}

const MENU_WIDTH = 208;
const ITEM_HEIGHT = 36;

/**
 * The kebab menu on a conversation (row in the rail, or the open
 * chat's header) — Pin, Mark as unread, Mute, Clear, Delete; the
 * destructive pair hands up to a confirmation dialog.
 *
 * The menu renders in a PORTAL at fixed coordinates measured from
 * the trigger: as an absolutely-positioned child of the scrolling
 * conversation list it was clipped by the list's overflow. It opens
 * upward when the viewport runs out below, and closes on outside
 * click, Escape, scroll, and resize.
 */
export function ThreadOptionsMenu({
  thread,
  onClearRequest,
  onDeleteRequest,
}: ThreadOptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const itemCount = unreadCount(thread) === 0 ? 5 : 4;

  const openMenu = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = itemCount * ITEM_HEIGHT + 8;
    const fitsBelow = window.innerHeight - rect.bottom >= menuHeight + 12;
    const top =
      !fitsBelow && rect.top > menuHeight + 12
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;
    setCoords({
      top,
      right: Math.max(8, window.innerWidth - rect.right),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
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
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-ink"
      >
        <Icon name="dots-vertical-rounded" size={24} />
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Chat with ${thread.name} — options`}
            style={{
              position: "fixed",
              top: coords.top,
              right: coords.right,
              width: MENU_WIDTH,
            }}
            className="z-50 rounded-xl border border-line bg-surface p-1 shadow-lg"
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
            {unreadCount(thread) === 0 && (
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
                toast(thread.muted ? "Chat unmuted" : "Chat muted", {
                  description: thread.name,
                });
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
          </div>,
          document.body,
        )}
    </div>
  );
}
