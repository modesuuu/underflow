import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
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

// TODO(backend): replace with GET /api/dashboard/notifications
export async function getNotifications(): Promise<NotificationItem[]> {
  if (!isApiConfigured()) {
    return NOTIFICATIONS;
  }
  const res = await apiFetch<ApiEnvelope<NotificationItem[]>>(
    "/api/dashboard/notifications"
  );
  return res.data;
}