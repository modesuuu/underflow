import { useSyncExternalStore } from "react";
import { COLLAB_PROJECTS } from "@/features/collaborations/mock";
import { NOTIFICATIONS } from "./mock";
import type { NotificationItem } from "./types";

/**
 * Session-scoped notification state, shared by the TopBar bell and
 * the Notifications page.
 *
 * Read state used to live inside the right-rail panel, so nothing
 * else could ever agree with it. The store seeds itself from the
 * same mock getNotifications serves and applies the same href
 * validation: a link resolves only when its target exists in the
 * local registries, so pressing a row never navigates to a dead
 * page. TODO(backend): GET /api/dashboard/notifications plus PATCH
 * read flags replace the seed and the in-memory writes.
 */

function resolveHref(item: NotificationItem): string | undefined {
  const collab = item.link?.match(/^\/collaborations\/([\w-]+)$/);
  if (collab && COLLAB_PROJECTS.some((p) => p.id === collab[1])) {
    return item.link;
  }
  return undefined;
}

let items: NotificationItem[] = NOTIFICATIONS.map((item) => ({
  ...item,
  href: resolveHref(item),
}));

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
}

export function markAllNotificationsRead() {
  if (!items.some((item) => !item.read)) return;
  items = items.map((item) => (item.read ? item : { ...item, read: true }));
  emit();
}
