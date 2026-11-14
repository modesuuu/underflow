"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import {
  markNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/dashboard/notifications-store";
import type { NotificationItem } from "@/features/dashboard/types";
import { openApplicationThreadByProject } from "@/features/inbox/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * TopBar bell + notifications dropdown, present on every page.
 *
 * The dropdown is the quick view: the five latest notifications with
 * the same tap-to-open semantics as the Notifications page (a press
 * marks the item read and navigates when it has a resolved
 * destination). The full list lives on /notifications, linked from
 * the dropdown footer. Read state comes from the shared
 * notifications store, so the badge, this dropdown, and the page
 * never disagree. Outside-click / Escape close included.
 */
export function NotificationsBell() {
  const { t } = useLanguage();
  const [bellOpen, setBellOpen] = useState(false);
  const items = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const router = useRouter();

  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const bellPanelRef = useRef<HTMLDivElement>(null);

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

  // Phones (user order 2026-11-09): the bell goes straight to the
  // notifications page — no dropdown preview on a small screen.
  // Desktop (lg+) keeps the dropdown preview.
  const handleBellClick = () => {
    if (window.innerWidth < 1024) {
      router.push("/notifications");
      return;
    }
    setBellOpen((v) => !v);
  };

  const press = (item: NotificationItem) => {
    if (!item.read) markNotificationRead(item.id);
    setBellOpen(false);
    if (item.openCollabId) {
      void openApplicationThreadByProject(item.openCollabId);
      router.push("/inbox");
    } else if (item.href) {
      // Admin destinations live in the other RootShell frame: load
      // a fresh document instead of soft-navigating across frames.
      if (item.href.startsWith("/admin")) {
        window.location.assign(item.href);
      } else {
        router.push(item.href);
      }
    }
  };

  return (
    <div className="relative">
      <button
        ref={bellBtnRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? t("notif.ariaUnread", { count: unreadCount })
            : t("notif.title")
        }
        aria-haspopup="true"
        aria-expanded={bellOpen}
        onClick={handleBellClick}
        className="pressable relative cursor-pointer rounded-md p-1 text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-badge px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {bellOpen && (
        <div
          ref={bellPanelRef}
          role="dialog"
          aria-label={t("notif.title")}
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface p-3 shadow-lg"
        >
          <h3 className="mb-2 text-sm font-medium text-ink">{t("notif.title")}</h3>
          {items.length === 0 ? (
            <p className="text-xs text-muted">{t("notif.emptyShort")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-placeholder">
              {items.slice(0, 5).map((item) => {
                const name = item.actor?.name ?? item.title;
                const subline = item.action ?? item.title;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => press(item)}
                      className="flex w-full cursor-pointer items-start gap-3 py-2 text-left focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                    >
                      <Avatar size={32} src={item.actor?.avatarUrl} alt={name} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={
                            item.read
                              ? "text-sm text-muted"
                              : "text-sm font-medium text-ink"
                          }
                        >
                          {name}
                        </span>
                        {subline && (
                          <span className="text-xs leading-snug text-muted">
                            {subline}
                          </span>
                        )}
                        {(item.timeLabel ?? item.agoLabel) && (
                          <span className="text-[11px] text-subtle">
                            {item.timeLabel ?? item.agoLabel}
                          </span>
                        )}
                      </span>
                      {!item.read && (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/notifications"
            onClick={() => setBellOpen(false)}
            className="mt-2 flex items-center justify-center rounded-md bg-bg px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-placeholder/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {t("notif.seeAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
