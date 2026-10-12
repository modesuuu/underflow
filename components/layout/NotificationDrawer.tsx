"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { getNotifications } from "@/features/dashboard/api";
import type { NotificationItem } from "@/features/dashboard/types";

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The right-hand notification rail, reworked as a slide-over drawer. Same
 * content and read/unread behaviour as the old fixed panel (it renders the
 * panel itself), opened from the TopBar bell, closing on Esc/backdrop with the
 * Base UI focus trap restoring focus to the bell.
 */
export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load on first open; the drawer is the only consumer while open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getNotifications()
      .then((n) => {
        if (!cancelled) setNotifications(n);
      })
      .catch(() => {
        /* mock path cannot fail; real API errors leave the list empty */
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" aria-describedby={undefined}>
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <NotificationsPanel notifications={notifications} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
