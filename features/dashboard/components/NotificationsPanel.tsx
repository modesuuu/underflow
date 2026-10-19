"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "../notifications-store";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { resolvePersonId } from "@/features/profile/mock";
import type { NotificationItem } from "../types";

type Tab = "all" | "unread" | "read";

interface TabDef {
  id: Tab;
  label: string;
}

const TABS: TabDef[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

const EMPTY_COPY: Record<Tab, string> = {
  all: "No notifications. Activity from your projects appears here.",
  unread: "No unread notifications.",
  read: "No read notifications. Notifications you open move here.",
};

function filterByTab(items: NotificationItem[], tab: Tab): NotificationItem[] {
  // Contract field is `read` (audit P1-A #6) — the inverse of the old `unread`.
  if (tab === "unread") return items.filter((n) => !n.read);
  if (tab === "read") return items.filter((n) => n.read);
  return items;
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  // Contract base row data: title + body. The rich actor/action/target
  // extension fields (mock today, backend-confirmed later) take over the
  // name + subline when present; `body` is the wire fallback.
  const name = item.actor?.name ?? item.title;
  const subline =
    item.action || item.target
      ? `${item.action ?? ""} ${item.target ?? ""}`.trim()
      : item.body;
  const actorId = item.actor ? resolvePersonId(item.actor.id) : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3">
        {actorId && item.actor ? (
          <Link
            href={`/profile/${actorId}`}
            aria-label={`View ${item.actor.name}'s profile`}
            className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Avatar size={32} src={item.actor?.avatarUrl} alt={name} />
          </Link>
        ) : (
          <Avatar size={32} src={item.actor?.avatarUrl} alt={name} />
        )}
        <button
          type="button"
          onClick={onPress}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={clsx(
                "text-sm",
                item.read ? "text-muted" : "font-medium text-ink",
              )}
            >
              {name}
            </span>
            {subline && (
              <span className="text-xs leading-snug text-muted">{subline}</span>
            )}
            {(item.timeLabel ?? item.agoLabel) && (
              <span className="text-[11px] text-subtle">
                {item.timeLabel ?? item.agoLabel}
              </span>
            )}
          </span>
          {/* Unread marker — a real state, so the dot earns its place;
              the sr-only word carries the meaning. */}
          {!item.read && (
            <span className="mt-1.5 flex shrink-0 items-center">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
              <span className="sr-only">Unread</span>
            </span>
          )}
          {item.href && (
            <Icon
              name="chevron-right"
              size={18}
              className="mt-0.5 shrink-0 text-subtle"
            />
          )}
        </button>
      </div>

    </div>
  );
}

/**
 * Notifications list (the /notifications page body): a segmented
 * tab control with a sliding indicator (the transitions.dev
 * pattern), rows that quiet down once read. Read state lives in
 * the shared notifications store, so the TopBar bell badge and
 * this list always agree.
 */
export function NotificationsPanel() {
  const [tab, setTab] = useState<Tab>("all");
  const items = useNotifications();

  const unreadCount = items.filter((n) => !n.read).length;
  const counts: Record<Tab, number> = {
    all: items.length,
    unread: unreadCount,
    read: items.length - unreadCount,
  };
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const visible = filterByTab(items, tab);

  const router = useRouter();

  const markRead = (item: NotificationItem) => {
    if (!item.read) {
      markNotificationRead(item.id);
    }
  };

  // Instagram-style tap-to-open: pressing a row marks it read
  // and, when it has a resolved destination, navigates to the
  // thing the notification is about. There is no expanded
  // detail anymore — the destination IS the detail. A row
  // without a destination only marks itself read.
  const press = (item: NotificationItem) => {
    markRead(item);
    if (item.href) {
      router.push(item.href);
    }
  };

  const markAllRead = () => markAllNotificationsRead();

  return (
    <div className="page-enter flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="cursor-pointer text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Mark all read
            </button>
          )}
        </div>
        <div
          role="tablist"
          aria-label="Notification filter"
          className="relative grid grid-cols-3 rounded-full bg-bg p-1"
        >
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-surface shadow-[0_1px_3px_rgba(var(--uf-shadow-rgb),0.14)] transition-transform duration-200 ease-(--uf-ease-out)"
            style={{ transform: `translateX(${tabIndex * 100}%)` }}
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              className={clsx(
                "relative z-10 flex cursor-pointer items-center justify-center gap-1.5 rounded-full py-1.5 text-[13px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                tab === t.id ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {t.label}
              <span className="text-[11px] text-subtle">{counts[t.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((item, i) => (
          <Fragment key={item.id}>
            <NotificationRow
              item={item}
              onPress={() => press(item)}
            />
            {i < visible.length - 1 && (
              <div className="h-px w-full bg-placeholder" aria-hidden="true" />
            )}
          </Fragment>
        ))}
        {visible.length === 0 && (
          <p className="text-sm leading-relaxed text-muted">{EMPTY_COPY[tab]}</p>
        )}
      </div>
    </div>
  );
}
