"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
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

function NotificationRow({
  item,
  open,
  onToggle,
}: {
  item: NotificationItem;
  open: boolean;
  onToggle: () => void;
}) {
  // Contract base row data: title + body. The rich actor/action/target
  // extension fields (mock today, backend-confirmed later) take over the
  // name + subline when present; `body` is the wire fallback.
  const name = item.actor?.name ?? item.title;
  const subline =
    item.action || item.target
      ? `${item.action ?? ""} ${item.target ?? ""}`.trim()
      : item.body;
  const detailText = item.body ?? subline;
  const actorId = item.actor ? resolvePersonId(item.actor.id) : null;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start gap-3 text-left focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Avatar size={32} src={item.actor?.avatarUrl} alt={name} />
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
        <Icon
          name="chevron-down"
          size={18}
          className={clsx(
            "mt-0.5 shrink-0 text-subtle transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Detail — expands under the row. Opening a notification
          marks it read (the panel owns read state for the session).
          The contract's `link` field is deliberately not rendered
          yet: the mock values point at project ids that do not
          exist, and a dead link is worse than none. TODO(backend):
          render it once links resolve to real routes. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-(--uf-ease-out)"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-1.5 pt-3 pl-11">
            <p className="text-sm font-medium text-ink">{item.title}</p>
            {detailText && (
              <p className="text-sm leading-relaxed text-muted">{detailText}</p>
            )}
            <div className="flex items-center gap-4 pt-0.5">
              {actorId && item.actor && (
                <Link
                  href={`/profile/${actorId}`}
                  className="text-xs font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  View {item.actor.name}&rsquo;s profile
                </Link>
              )}
              {(item.timeLabel ?? item.agoLabel) && (
                <span className="text-[11px] text-subtle">
                  {item.timeLabel ?? item.agoLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Right panel: a segmented tab control with a sliding indicator
 * (the transitions.dev pattern), rows that quiet down once read,
 * and an expandable detail per notification. Read state is
 * panel-local for the session — TODO(backend): PATCH read flags.
 */
export function NotificationsPanel({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [openId, setOpenId] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.read).length;
  const counts: Record<Tab, number> = {
    all: items.length,
    unread: unreadCount,
    read: items.length - unreadCount,
  };
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const visible = filterByTab(items, tab);

  const toggle = (item: NotificationItem) => {
    if (openId === item.id) {
      setOpenId(null);
      return;
    }
    setOpenId(item.id);
    if (!item.read) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
    }
  };

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));

  return (
    <div className="page-enter flex flex-col gap-6 p-6">
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
              open={openId === item.id}
              onToggle={() => toggle(item)}
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
