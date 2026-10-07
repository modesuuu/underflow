import { apiFetch, isApiConfigured } from "@/lib/api-client";
import { NOTIFICATIONS, POSTS } from "./mock";
import type { NotificationItem, Post } from "./types";

// TODO(backend): replace with GET /api/dashboard/posts
export async function getDashboardPosts(): Promise<Post[]> {
  if (!isApiConfigured()) {
    return POSTS;
  }
  return apiFetch<Post[]>("/api/dashboard/posts");
}

// TODO(backend): replace with GET /api/dashboard/notifications
export async function getNotifications(): Promise<NotificationItem[]> {
  if (!isApiConfigured()) {
    return NOTIFICATIONS;
  }
  return apiFetch<NotificationItem[]>("/api/dashboard/notifications");
}