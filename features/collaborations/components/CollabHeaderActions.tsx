"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MakeCollabModal } from "./MakeCollabModal";
import { getNotifications } from "@/features/dashboard/api";
import type { NotificationItem } from "@/features/dashboard/types";

/**
 * Right-side header actions for /collaborations (Figma "Collaborations" frame).
 * Bell → notifications dropdown (read-only, closes on outside-click/Escape).
 * "+ Create Project" → MakeCollabModal (moved here from the old FAB).
 * Settings icon omitted — no settings surface exists.
 */
export function CollabHeaderActions() {
  const [modalOpen, setModalOpen] = useState(false);
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
    <>
      {/* Bell → notifications dropdown */}
      <div className="relative">
        <button
          ref={bellBtnRef}
          type="button"
          aria-label="Notifications"
          aria-haspopup="true"
          aria-expanded={bellOpen}
          onClick={() => setBellOpen((v) => !v)}
          className="cursor-pointer text-ink"
        >
          <Icon name="bell" size={20} />
        </button>
        {bellOpen && (
          <div
            ref={bellPanelRef}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-line bg-surface p-3 shadow-lg"
          >
            <h3 className="mb-2 text-sm font-medium text-ink">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-muted">No notifications.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-placeholder">
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

      {/* + Create Project */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex cursor-pointer items-center gap-1 rounded-md bg-accent p-2 transition-opacity hover:opacity-85"
      >
        <Icon name="plus" size={16} />
        <span className="text-sm font-medium">Create Project</span>
      </button>

      <MakeCollabModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
