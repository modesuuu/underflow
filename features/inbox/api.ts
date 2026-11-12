import { apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { InboxSummary } from "./types";

/**
 * Inbox API — the real backend endpoints (bk-underflow
 * InboxController), replacing the session-store reads this module
 * used to serve. Conversations and messages are persisted in the
 * dm_* tables; application threads are created by the apply flow.
 */

export interface BackendInboxMessage {
  id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface BackendInboxApplication {
  id: string;
  collab_id: string;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  direction: "incoming" | "outgoing";
  project_title: string;
  project_meta: string;
  due_date: string | null;
  slots_filled: number;
  slots_total: number;
}

export interface BackendConversation {
  id: string;
  other: { id: string; username: string; photo_profile_url: string };
  last_message: {
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  updated_at: string;
  application: BackendInboxApplication | null;
}

export async function fetchConversations(): Promise<BackendConversation[]> {
  const res = await apiFetch<ApiEnvelope<BackendConversation[]>>(
    "/api/inbox/conversations",
  );
  return res.data ?? [];
}

export async function fetchMessages(
  conversationId: string,
): Promise<BackendInboxMessage[]> {
  const res = await apiFetch<ApiEnvelope<{ messages: BackendInboxMessage[] }>>(
    `/api/inbox/conversations/${conversationId}/messages`,
  );
  return res.data?.messages ?? [];
}

export async function postMessage(
  conversationId: string,
  body: string,
): Promise<BackendInboxMessage> {
  const res = await apiFetch<ApiEnvelope<{ message: BackendInboxMessage }>>(
    `/api/inbox/conversations/${conversationId}/messages`,
    { method: "POST", body: JSON.stringify({ body }) },
  );
  if (!res.data?.message) throw new Error("Message failed to send");
  return res.data.message;
}

export async function ensureDirectConversation(
  userId: string,
): Promise<BackendConversation> {
  const res = await apiFetch<ApiEnvelope<BackendConversation>>(
    "/api/inbox/conversations",
    { method: "POST", body: JSON.stringify({ userId }) },
  );
  if (!res.data) throw new Error("Could not open the conversation");
  return res.data;
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/inbox/conversations/${conversationId}/read`,
    { method: "POST" },
  );
}

export async function toggleConversationMute(
  conversationId: string,
): Promise<boolean> {
  const res = await apiFetch<ApiEnvelope<{ muted: boolean }>>(
    `/api/inbox/conversations/${conversationId}/mute`,
    { method: "PUT" },
  );
  return res.data?.muted ?? false;
}

export async function toggleConversationPin(
  conversationId: string,
): Promise<boolean> {
  const res = await apiFetch<ApiEnvelope<{ pinned: boolean }>>(
    `/api/inbox/conversations/${conversationId}/pin`,
    { method: "PUT" },
  );
  return res.data?.pinned ?? false;
}

export async function clearConversation(
  conversationId: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/inbox/conversations/${conversationId}/clear`,
    { method: "POST" },
  );
}

export async function hideConversation(conversationId: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/inbox/conversations/${conversationId}`,
    { method: "DELETE" },
  );
}

export async function restoreConversation(
  conversationId: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/inbox/conversations/${conversationId}/restore`,
    { method: "POST" },
  );
}

/** GET /api/inbox/summary — the contract v1 badge count, now real. */
export async function getInboxSummary(): Promise<InboxSummary> {
  try {
    const res = await apiFetch<ApiEnvelope<{ unreadCount: number }>>(
      "/api/inbox/summary",
    );
    return { unreadCount: res.data?.unreadCount ?? 0 };
  } catch {
    return { unreadCount: 0 };
  }
}
