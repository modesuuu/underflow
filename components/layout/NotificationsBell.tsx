"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getNotifications } from "@/features/dashboard/api";
import type { NotificationItem } from "@/features/dashboard/types";

/**
 * Bell + notifications dropdown (read-only). Extracted from
 * CollabHeaderActions so /my-collaborations can reuse it without dragging in
 * the Create Project button. Outside-click / Escape close included.
 */
export function NotificationsBell() {
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const bellPanelRef = useRef<HTMLDivElement>(null);

  // Load notifications lazily on first bell open
  useEffect(() => {
    if (!bellOpen) return;
    let cancelled = false;
    getNotifications()
      .then((n) => {
        if (!cancelled) setNotifications(n);
      })
      .catch(() => {
        /* mock path cannot fail; real API errors just leave the list empty */
      });
    return () => {
      cancelled = true;
    };
  }, [bellOpen]);

  // Close on outside-click / Escape
  useEffect(() => {
    if (!bellOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (bellBtnRef.current?.contains(target)) return;
      if (bellPanelRef.current?.contains(target)) return;
      setBellOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBellOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [bellOpen]);

  return (
    <div className="relative">
      <button
        ref={bellBtnRef}
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={bellOpen}
        onClick={() => setBellOpen((v) => !v)}
        className="pressable cursor-pointer rounded-sm p-1 text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="bell" size={20} />
      </button>
      {bellOpen && (
        <div
          ref={bellPanelRef}
          role="dialog"
          aria-label="Notifications"
          className="sheet sheet-lift absolute right-0 top-full z-50 mt-2 w-80 p-3"
        >
          <h3 className="mb-2 border-b border-rule pb-2 text-xs font-semibold tracking-[0.06em] text-muted">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-muted">No notifications.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-rule">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="flex flex-col gap-0.5 py-2">
                  <span className="text-xs font-medium text-ink">
                    {n.action} {n.target}
                  </span>
                  <span className="text-2xs text-muted">{n.timeLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
