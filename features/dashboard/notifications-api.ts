import {
  ApiEnvelope,
  apiFetch,
} from "@/lib/api-client";
import type { NotificationItem, PostAuthor } from "./types";
import { formatRelativeAgoFine, tStatic } from "@/lib/i18n/format";

/**
 * Wire shape of GET /api/notifications (NotificationController) —
 * the WS "notification" push carries the exact same shape.
 */
export interface BackendNotification {
  id: string;
  type: "like" | "comment" | "comment_like" | "application" | "admin_action_request" | "admin_request_decided" | "admin_appeal";
  title: string;
  is_read: boolean | number;
  created_at: string;
  actor: {
    id: string | null;
    username: string | null;
    photo: string | null;
  };
  postId: string | null;
  collabId: string | null;
  link: string | null;
}

/** Relative label for a notification timestamp ("just now", "5m ago", ...). */
function relativeAgo(iso: string | undefined): string {
  if (!iso) return "";
  return formatRelativeAgoFine(iso);
}

/** Map one wire notification (list endpoint or WS push) to the store shape. */
export function mapWireNotification(b: BackendNotification): NotificationItem {
  const actor: PostAuthor | undefined = b.actor?.id
    ? {
        id: b.actor.id,
        name: b.actor.username ?? tStatic("notif.someone"),
        avatarUrl: b.actor.photo ?? undefined,
      }
    : undefined;
  const link = b.link ?? undefined;
  return {
    id: b.id,
    title: b.title,
    createdAt: b.created_at,
    read: b.is_read === true || b.is_read === 1,
    actor,
    action:
      b.type === "like"
        ? tStatic("notif.actionLikedPost")
        : b.type === "comment_like"
          ? tStatic("notif.actionLikedComment")
          : b.type === "application"
            ? tStatic("notif.actionApplied")
            : b.type === "admin_action_request" ||
                b.type === "admin_request_decided" ||
                b.type === "admin_appeal"
              ? b.title
              : tStatic("notif.actionCommented"),
    openCollabId:
      b.type === "application" ? (b.collabId ?? undefined) : undefined,

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
