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
  // extension fields take over the name + subline when present; `body` is
  // the wire fallback.
  const name = item.actor?.name ?? item.title;
  const subline =
    item.action || item.target
      ? `${item.action ?? ""} ${item.target ?? ""}`.trim()
      : item.body;
  return (
    <div className="flex min-h-[47px] items-start gap-4">
      <Avatar size={30} src={item.actor?.avatarUrl} alt={name} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-ink">{name}</span>
        {subline && <span className="text-xs text-muted">{subline}</span>}
        {(item.timeLabel ?? item.agoLabel) && (
          <span className="font-figures text-2xs text-subtle">
            {item.timeLabel ?? item.agoLabel}
          </span>
        )}
      </div>
      {/* Unread is marked in the margin red — the one colour that means
          attention. The dot stays decorative; sr-only carries the meaning. */}
      {!item.read && (
        <span className="mt-1 flex shrink-0 items-center">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-margin" />
          <span className="sr-only">Unread</span>
        </span>
      )}
    </div>
  );
}

/** Right panel. The tabs are a segmented control with a mono count. */
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
    <div className="flex flex-col gap-7 p-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Notifications</h2>
        <div className="flex w-full border border-rule">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={clsx(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-colors",
                i > 0 && "border-l border-rule",
                tab === t.id
                  ? "bg-ink text-surface"
                  : "bg-transparent text-muted hover:bg-surface"
              )}
            >
              {t.label}
              <span
                className={clsx(
                  "font-figures text-2xs",
                  tab === t.id ? "text-surface/70" : "text-subtle"
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {visible.map((item, i) => (
          <Fragment key={item.id}>
            <NotificationRow item={item} />
            {i < visible.length - 1 && (
              <div className="my-3 h-px w-full bg-rule" />
            )}
          </Fragment>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-muted">No notifications here.</p>
        )}
      </div>
    </div>
  );
}