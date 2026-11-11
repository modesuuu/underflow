import { useSyncExternalStore } from "react";
import type { NotificationItem } from "./types";
import {
  markAllNotificationsRead as apiMarkAllRead,
  markNotificationRead as apiMarkRead,
} from "./notifications-api";

/**
 * Session-scoped notification state, shared by the TopBar bell and
 * the Notifications page.
 *
 * Read state used to live inside the right-rail panel, so nothing
 * else could ever agree with it. The store starts empty (no
 * backend endpoint yet); TODO(backend): GET /api/notifications
 * plus PATCH read flags replace the seed and the in-memory writes.
 */

let items: NotificationItem[] = [];

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNotifications(): NotificationItem[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => items
  );
}

function countUnread(list: NotificationItem[]): number {
  return list.reduce((n, item) => n + (item.read ? 0 : 1), 0);
}

export function useUnreadNotificationCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => countUnread(items),
    () => countUnread(items)
  );
}

export function markNotificationRead(id: string) {
  if (!items.some((item) => item.id === id && !item.read)) return;
  items = items.map((item) =>
    item.id === id ? { ...item, read: true } : item
  );
  emit();
  // Fire-and-forget: the local state stays even if the call fails —
  // the next poll self-corrects from the server.
  void apiMarkRead(id).catch(() => {});
}

export function markAllNotificationsRead() {
  if (!items.some((item) => !item.read)) return;
  items = items.map((item) => (item.read ? item : { ...item, read: true }));
  emit();
  // Fire-and-forget: the next poll self-corrects if this fails.
  void apiMarkAllRead().catch(() => {});
}

/**
 * Replace the whole list (called by the LivePoller). This is how a
 * notification that was removed server-side (unlike / comment
 * deleted) disappears without a refresh.
 */
export function setNotifications(next: NotificationItem[]) {
  items = next;
  emit();
}

/**
 * Prepend one pushed notification (WS "notification"). Dedupes by id —
 * a push that arrives twice, or races with a poll, never duplicates.
 */
export function addNotification(item: NotificationItem) {
  if (items.some((existing) => existing.id === item.id)) return;
  items = [item, ...items];
  emit();
}

/** Remove one notification by id (WS "notification-removed"). */
export function removeNotification(id: string) {
  if (!items.some((item) => item.id === id)) return;
  items = items.filter((item) => item.id !== id);
  emit();
}
