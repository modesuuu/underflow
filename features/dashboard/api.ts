import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import { COLLAB_PROJECTS } from "@/features/collaborations/mock";
import { NOTIFICATIONS, POSTS } from "./mock";
import type { NotificationItem, Post } from "./types";

// TODO(backend): replace with GET /api/dashboard/posts (contract envelope
// `{ data, meta }` — typed so the mock→fetch swap cannot change call sites,
// audit P1-A #8; see docs/api-contract.md "Posts").
export async function getDashboardPosts(): Promise<Post[]> {
  if (!isApiConfigured()) {
    return POSTS;
  }
  const res = await apiFetch<ApiEnvelope<Post[]>>("/api/dashboard/posts");
  return res.data;
}

// Tap-to-open, but only to destinations that exist: a link whose
// target is not in the local registries resolves to nothing, and
// pressing that row only marks it read instead of navigating to
// a dead page. TODO(backend): the server should validate links when
// the API is live; keep this check as the seatbelt.
function resolveNotificationHref(item: NotificationItem): string | undefined {
  const collab = item.link?.match(/^\/collaborations\/([\w-]+)$/);
  if (collab && COLLAB_PROJECTS.some((p) => p.id === collab[1])) {
    return item.link;
  }
  return undefined;
}

// TODO(backend): replace with GET /api/dashboard/notifications
export async function getNotifications(): Promise<NotificationItem[]> {
  const items = !isApiConfigured()
    ? NOTIFICATIONS
    : (
        await apiFetch<ApiEnvelope<NotificationItem[]>>(
          "/api/dashboard/notifications"
        )
      ).data;
  return items.map((item) => ({
    ...item,
    href: resolveNotificationHref(item),
  }));
}