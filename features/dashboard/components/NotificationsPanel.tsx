"use client";

import { Fragment, useState } from "react";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { NotificationItem } from "../types";

type Tab = "all" | "unread" | "read";

interface TabDef {
  id: Tab;
  label: string;
}

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
    <div className="flex min-h-[47px] items-center gap-5">
      <div className="flex flex-1 items-start gap-2">
        <Avatar size={32} src={item.actor?.avatarUrl} alt={name} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium">{name}</span>
            {subline && (
              <span className="flex gap-0.5">
                <span className="text-xs text-muted">{subline}</span>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {(item.timeLabel ?? item.agoLabel) && (
              <span className="text-xs">{item.timeLabel ?? item.agoLabel}</span>
            )}
          </div>
        </div>
      </div>
      {/* Unread indicator (audit P1-C #20): the dot stays decorative, an
          sr-only word carries the meaning for screen readers. */}
      {!item.read && (
        <span className="flex shrink-0 items-center gap-1">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          <span className="sr-only">Unread</span>
        </span>
      )}
    </div>
  );
}

/** Right panel — Figma 515:150. "Unreed/Reed" in the design is a typo; labels are Unread/Read. */
export function NotificationsPanel({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [tab, setTab] = useState<Tab>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;

  const tabs: (TabDef & { count: number })[] = [
    { id: "all", label: "View all", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "read", label: "Read", count: readCount },
  ];

  const visible = filterByTab(notifications, tab);

  return (
    <div className="flex flex-col gap-[42px] p-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Notifications</h2>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-bg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={clsx(
                "flex cursor-pointer items-center gap-1.5 rounded-sm px-1 py-1.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-surface" : "hover:bg-surface/60"
              )}
            >
              {t.label}
              <Badge count={t.count} tone="accent" shape="pill" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((item, i) => (
          <Fragment key={item.id}>
            <NotificationRow item={item} />
            {i < visible.length - 1 && <div className="h-px w-full bg-placeholder" />}
          </Fragment>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-muted">No notifications here.</p>
        )}
      </div>
    </div>
  );
}