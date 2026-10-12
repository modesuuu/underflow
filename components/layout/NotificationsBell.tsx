"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { NotificationDrawer } from "./NotificationDrawer";
import { getNotifications } from "@/features/dashboard/api";
import type { NotificationItem } from "@/features/dashboard/types";

/**
 * Bell in the TopBar. Opens the notification drawer (slide-over) instead of the
 * old fixed right rail; the badge shows the unread count and the drawer keeps
 * the panel's read/unread behaviour intact.
 */
export function NotificationsBell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Seed the unread badge as soon as the bell mounts.
  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((n) => {
        if (cancelled) return;
        setNotifications(n);
      })
      .catch(() => {
        /* mock path cannot fail */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(true)}
        className="pressable relative cursor-pointer rounded-md p-1 text-ink transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span
            aria-live="polite"
            className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-pill bg-badge font-mono text-[9px] font-medium leading-none text-white"
          >
            {unread}
          </span>
        )}
      </button>
      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
