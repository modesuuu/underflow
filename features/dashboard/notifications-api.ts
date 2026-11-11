import {
  ApiEnvelope,
  apiFetch,
} from "@/lib/api-client";
import type { NotificationItem, PostAuthor } from "./types";

/**
 * Wire shape of GET /api/notifications (NotificationController) —
 * the WS "notification" push carries the exact same shape.
 */
export interface BackendNotification {
  id: string;
  type: "like" | "comment" | "comment_like";
  title: string;
  body: string | null;
  is_read: boolean | number;
  created_at: string;
  actor: {
    id: string | null;
    username: string | null;
    photo: string | null;
  };
  postId: string | null;
  postTitle: string | null;
  link: string | null;
}

/** Relative label for a notification timestamp ("just now", "5m ago", ...). */
function relativeAgo(iso: string | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(ms / 86_400_000);
  return days + "d ago";
}

/** Map one wire notification (list endpoint or WS push) to the store shape. */
export function mapWireNotification(b: BackendNotification): NotificationItem {
  const actor: PostAuthor | undefined = b.actor?.id
    ? {
        id: b.actor.id,
        name: b.actor.username ?? "Someone",
        avatarUrl: b.actor.photo ?? undefined,
      }
    : undefined;
  const link = b.link ?? undefined;
  return {
    id: b.id,
    title: b.title,
    body: b.body ?? undefined,
    createdAt: b.created_at,
    read: b.is_read === true || b.is_read === 1,
    actor,
    action:
      b.type === "like"
        ? "liked your post"
        : b.type === "comment_like"
          ? "liked your comment"
          : "commented on your post",
    // Quoted detail after the action: the comment text for comment
    // notifications (comment/comment_like), the post title for post likes.
    target:
      b.type === "like"
        ? (b.postTitle ?? undefined)
        : (b.body ?? undefined),
    link,
    href: link,
    agoLabel: relativeAgo(b.created_at),
  };
}

/** GET /api/notifications (auth required). Newest first. */
export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch<ApiEnvelope<BackendNotification[]>>(
    "/api/notifications"
  );
  return (res.data ?? []).map(mapWireNotification);
}

/** PUT /api/notifications/:id/read (auth required). */
export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch("/api/notifications/" + id + "/read", { method: "PUT" });
}

/** POST /api/notifications/read-all (auth required). */
export async function markAllNotificationsRead(): Promise<{
  marked: number;
}> {
  const res = await apiFetch<ApiEnvelope<{ marked: number }>>(
    "/api/notifications/read-all",
    { method: "POST" }
  );
  return res.data;
}
