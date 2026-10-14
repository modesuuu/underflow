"use client";

import { Fragment, useState } from "react";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
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
  all: "Nothing yet — activity from your projects lands here.",
  unread: "All caught up. Nothing unread.",
  read: "Nothing here yet. Open a notification and it moves to Read.",
};

function filterByTab(items: NotificationItem[], tab: Tab): NotificationItem[] {
  // Contract field is `read` (audit P1-A #6) — the inverse of the old `unread`.
  if (tab === "unread") return items.filter((n) => !n.read);
  if (tab === "read") return items.filter((n) => n.read);
  return items;
}

function NotificationRow({ item }: { item: NotificationItem }) {
  // Contract base row data: title + body. The rich actor/action/target
  // extension fields (mock today, backend-confirmed later) take over the
  // name + subline when present; `body` is the wire fallback.
  const name = item.actor?.name ?? item.title;
  const subline =
    item.action || item.target
      ? `${item.action ?? ""} ${item.target ?? ""}`.trim()
      : item.body;
  return (
    <div className="flex items-start gap-3">
      <Avatar size={32} src={item.actor?.avatarUrl} alt={name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={clsx(
            "text-sm",
            item.read ? "text-muted" : "font-medium text-ink",
          )}
        >
          {name}
        </span>
        {subline && <span className="text-xs leading-snug text-muted">{subline}</span>}
        {(item.timeLabel ?? item.agoLabel) && (
          <span className="text-[11px] text-subtle">
            {item.timeLabel ?? item.agoLabel}
          </span>
        )}
      </div>
      {/* Unread marker — a real state, so the dot earns its place;
          the sr-only word carries the meaning. */}
      {!item.read && (
        <span className="mt-1.5 flex shrink-0 items-center">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          <span className="sr-only">Unread</span>
        </span>
      )}
    </div>
  );
}

/**
 * Right panel, 2026 redesign: a segmented tab control with a
 * sliding indicator (the transitions.dev pattern) instead of
 * three loose buttons, and rows that quiet down once read.
 */
export function NotificationsPanel({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [tab, setTab] = useState<Tab>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const counts: Record<Tab, number> = {
    all: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
  };
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const visible = filterByTab(notifications, tab);

  return (
    <div className="page-enter flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Notifications</h2>
        <div
          role="tablist"
          aria-label="Notification filter"
          className="relative grid grid-cols-3 rounded-full bg-bg p-1"
        >
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-surface shadow-[0_1px_3px_rgba(17,17,17,0.14)] transition-transform duration-200 ease-(--uf-ease-out)"
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
            <NotificationRow item={item} />
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
