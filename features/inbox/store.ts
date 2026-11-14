import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { getSessionUser } from "@/features/auth/session";
import {
  acceptCollabApplication,
  declineCollabApplication,
  withdrawCollabApplication,
} from "@/features/collaborations/api";
import { formatDueDate } from "@/features/collaborations/sort";
import {
  clearConversation as apiClearConversation,
  ensureDirectConversation,
  fetchConversations,
  fetchMessages,
  hideConversation as apiHideConversation,
  markConversationRead,
  postMessage,
  restoreConversation as apiRestoreConversation,
  toggleConversationMute,
  toggleConversationPin,
  type BackendConversation,
  type BackendInboxMessage,
} from "./api";
import type { ApplicationStatus, ChatMessage, Conversation } from "./types";
import { formatShortAgo, localeTag, tStatic } from "@/lib/i18n/format";

/**
 * Inbox store — API-backed since 2026-11-12 (was session memory).
 * Conversations and messages live in the backend (dm_* tables);
 * this module keeps the same external-store shape the UI already
 * reads (thread list, open chat, Sidebar badge) and syncs it with
 * the API: refresh on mount / realtime events / polling fallback,
 * messages fetched per thread when it is opened, sends optimistic.
 *
 * One source of truth for unread, as before: a loaded thread
 * derives it from its messages; an unloaded one trusts the
 * server's per-thread count. Muted threads never feed the badge.
 */

let conversations: Conversation[] = [];
const listeners = new Set<() => void>();
/** Threads whose full message history has been fetched. */
const loadedMessages = new Set<string>();
let refreshInFlight: Promise<void> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Conversation[] {
  return conversations;
}

/** Plain (non-hook) read of the current thread list. */
export function getConversationsList(): Conversation[] {
  return conversations;
}

export function useConversations(): Conversation[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function unreadCount(thread: Conversation): number {
  if (loadedMessages.has(thread.id)) {
    return thread.messages.filter((m) => m.from === "them" && !m.read).length;
  }
  return thread.serverUnread ?? 0;
}

export function countUnread(list: Conversation[]): number {
  return list.reduce(
    (sum, thread) => sum + (thread.muted ? 0 : unreadCount(thread)),
    0,
  );
}

export function useInboxUnreadCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => countUnread(conversations),
    () => 0,
  );
}

function replaceThread(id: string, update: (thread: Conversation) => Conversation) {
  conversations = conversations.map((thread) =>
    thread.id === id ? update(thread) : thread,
  );
  emit();
}

// ── Wire → UI mapping ──────────────────────────────────────────

function myId(): string | null {
  return getSessionUser()?.id ?? null;
}

function timeLabelOf(iso: string): string {
  return formatShortAgo(iso);
}

function clockOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(localeTag(), { hour: "2-digit", minute: "2-digit" });
}

const clockNow = () =>
  new Date().toLocaleTimeString(localeTag(), {
    hour: "2-digit",
    minute: "2-digit",
  });

function mapMessage(m: BackendInboxMessage): ChatMessage {
  return {
    id: m.id,
    from: m.sender_id === myId() ? "me" : "them",
    text: m.body,
    timeLabel: timeLabelOf(m.created_at),
    clock: clockOf(m.created_at),
    read: m.is_read,
    moderationActionId: m.moderation_action_id ?? null,
  };
}

function mapConversation(
  b: BackendConversation,
  prev?: Conversation,
): Conversation {
  const hasLoaded = prev !== undefined && loadedMessages.has(b.id);
  return {
    id: b.id,
    personId: b.other.id,
    name: b.kind === "system" ? "Underflow Admin" : b.other.username,
    kind: (b.kind as Conversation["kind"]) ?? "direct",
    avatarUrl: b.other.photo_profile_url || undefined,
    messages: hasLoaded ? prev.messages : [],
    muted: b.is_muted || undefined,
    pinned: b.is_pinned || undefined,
    serverUnread: hasLoaded ? 0 : b.unread_count,
    updatedAt: b.updated_at,
    preview:
      !hasLoaded && b.last_message
        ? {
            from: b.last_message.sender_id === myId() ? "me" : "them",
            text: b.last_message.body,
            timeLabel: timeLabelOf(b.last_message.created_at),
          }
        : undefined,
    application: b.application
      ? {
          applicationId: b.application.id,
          projectId: b.application.collab_id,
          projectTitle: b.application.project_title,
          projectMeta: b.application.project_meta,
          dueLabel: b.application.due_date
            ? formatDueDate(b.application.due_date)
            : "No due date",
          slotsLabel: `${b.application.slots_filled} / ${b.application.slots_total}`,
          direction: b.application.direction,
          status: b.application.status,
        }
      : undefined,
  };
}

// ── Sync ───────────────────────────────────────────────────────

/**
 * Reload the conversation list from the API. Loaded threads keep
 * their fetched messages; everything else (order, unread, flags,
 * application cards) follows the server. Deduped while in flight.
 */
export function refreshConversations(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const list = await fetchConversations();
      const prevById = new Map(conversations.map((t) => [t.id, t]));
      conversations = list.map((b) => mapConversation(b, prevById.get(b.id)));
      emit();
    } catch {
      // Best-effort: keep showing what we have; the next tick retries.
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** A realtime inbox-message event landed (LivePoller forwards it). */
export function applyRealtimeInboxMessage(
  conversationId: string,
  raw: BackendInboxMessage,
): void {
  const thread = conversations.find((t) => t.id === conversationId);
  if (thread && loadedMessages.has(conversationId)) {
    const mapped = mapMessage(raw);
    if (!thread.messages.some((m) => m.id === mapped.id)) {
      const updated = { ...thread, messages: [...thread.messages, mapped] };
      conversations = [
        updated,
        ...conversations.filter((t) => t.id !== conversationId),
      ];
      emit();
    }
  }
  void refreshConversations();
}

/** A realtime inbox-update event landed (status changed, no message). */
export function applyRealtimeInboxUpdate(_conversationId: string): void {
  void refreshConversations();
}

/**
 * Open a thread: fetch its history once, then mark it read on the
 * server and locally. Called by the shell when a thread is selected
 * (and again when new messages land in the open thread).
 */
export async function openThread(id: string): Promise<void> {
  if (!loadedMessages.has(id)) {
    try {
      const messages = await fetchMessages(id);
      loadedMessages.add(id);
      replaceThread(id, (t) => ({
        ...t,
        messages: messages.map(mapMessage),
        preview: undefined,
        serverUnread: 0,
      }));
    } catch {
      return;
    }
  }
  try {
    await markConversationRead(id);
  } catch {
    // Best-effort: the local state below still clears the badge.
  }
  replaceThread(id, (t) => ({
    ...t,
    serverUnread: 0,
    messages: t.messages.map((m) => (m.read ? m : { ...m, read: true })),
  }));
}

/** Local-only quick marker kept for API compatibility. */
export function markThreadRead(id: string) {
  const thread = conversations.find((t) => t.id === id);
  if (!thread || unreadCount(thread) === 0) return;
  replaceThread(id, (t) => ({
    ...t,
    serverUnread: 0,
    messages: t.messages.map((m) => (m.read ? m : { ...m, read: true })),
  }));
}

// ── Thread actions (local-first, API follows) ──────────────────

/** Remove the thread from my list (Delete chat, after confirmation). */
export function deleteThread(id: string) {
  conversations = conversations.filter((thread) => thread.id !== id);
  loadedMessages.delete(id);
  emit();
  void apiHideConversation(id).catch(() => {
    void refreshConversations();
  });
}

/**
 * Undo for Clear/Delete: the server un-hides and un-clears the
 * thread for me, then the list reloads (history included).
 */
export function restoreThread(snapshot: Conversation) {
  void (async () => {
    try {
      await apiRestoreConversation(snapshot.id);
    } catch {
      // Still refresh — the list resyncs either way.
    }
    loadedMessages.delete(snapshot.id);
    await refreshConversations();
  })();
}

/** Empty my visible history (Clear chat); the thread + application stay. */
export function clearThread(id: string) {
  replaceThread(id, (t) => ({ ...t, messages: [], serverUnread: 0 }));
  void apiClearConversation(id).catch(() => {
    void refreshConversations();
  });
}

export function toggleMuteThread(id: string) {
  replaceThread(id, (t) => ({ ...t, muted: !t.muted }));
  void toggleConversationMute(id).catch(() => {
    void refreshConversations();
  });
}

export function togglePinThread(id: string) {
  replaceThread(id, (t) => ({ ...t, pinned: !t.pinned }));
  void toggleConversationPin(id).catch(() => {
    void refreshConversations();
  });
}

/**
 * Mark-as-unread is a local affordance only (the server has no
 * "unread by me" flag): it re-lights this session's badges.
 */
export function markThreadUnread(id: string) {
  replaceThread(id, (t) => {
    if (unreadCount(t) > 0) return t;
    if (loadedMessages.has(id)) {
      const lastIncoming = t.messages.map((m) => m.from).lastIndexOf("them");
      if (lastIncoming === -1) return t;
      return {
        ...t,
        messages: t.messages.map((m, i) =>
          i === lastIncoming ? { ...m, read: false } : m,
        ),
      };
    }
    return { ...t, serverUnread: 1 };
  });
}

// ── Sending ────────────────────────────────────────────────────

let messageSeq = 0;

/**
 * Optimistic send: the bubble appears immediately and is swapped
 * for the server message; on failure it rolls back with a toast.
 * The other participant receives it via the realtime publish.
 */
export function sendMessage(threadId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const thread = conversations.find((t) => t.id === threadId);
  if (!thread) return;
  messageSeq += 1;
  const tempId = `temp-${messageSeq}`;
  const optimistic: ChatMessage = {
    id: tempId,
    from: "me",
    text: trimmed,
    timeLabel: "now",
    clock: clockNow(),
    read: true,
  };
  loadedMessages.add(threadId);
  const updated = {
    ...thread,
    messages: [...thread.messages, optimistic],
    preview: undefined,
  };
  // Latest activity rises: the thread moves to the top of its
  // pin group (the list renders pinned threads first).
  conversations = [
    updated,
    ...conversations.filter((t) => t.id !== threadId),
  ];
  emit();

  void (async () => {
    try {
      const saved = await postMessage(threadId, trimmed);
      replaceThread(threadId, (t) => ({
        ...t,
        messages: t.messages.map((m) =>
          m.id === tempId ? mapMessage(saved) : m,
        ),
      }));
    } catch {
      replaceThread(threadId, (t) => ({
        ...t,
        messages: t.messages.filter((m) => m.id !== tempId),
      }));
      toast.error(tStatic("inbox.messageFailed"), {
        description: tStatic("inbox.checkConnection"),
      });
    }
  })();
}

// ── Applications ───────────────────────────────────────────────

/**
 * Owner Accept/Decline from the thread's application card — hits
 * the real collab endpoints, so the roster and seat counts move.
 * Throws on failure (the caller toasts the backend's message).
 */
export async function resolveApplication(
  threadId: string,
  status: Extract<ApplicationStatus, "accepted" | "declined">,
): Promise<void> {
  const thread = conversations.find((t) => t.id === threadId);
  const application = thread?.application;
  if (!thread || !application) return;
  if (status === "accepted") {
    await acceptCollabApplication(
      application.projectId,
      application.applicationId,
    );
  } else {
    await declineCollabApplication(
      application.projectId,
      application.applicationId,
    );
  }
  replaceThread(threadId, (t) =>
    t.application
      ? { ...t, application: { ...t.application, status } }
      : t,
  );
  void refreshConversations();
}

/**
 * Applicant withdraws their own pending application (real endpoint;
 * the backend application leaves 'pending' for good). Throws on
 * failure.
 */
export async function withdrawApplication(projectId: string): Promise<void> {
  await withdrawCollabApplication(projectId);
  const thread = conversations.find(
    (t) =>
      t.application?.projectId === projectId &&
      t.application.direction === "outgoing",
  );
  if (thread) {
    replaceThread(thread.id, (t) =>
      t.application
        ? { ...t, application: { ...t.application, status: "withdrawn" } }
        : t,
    );
  }
}

export interface OutgoingApplicationInput {
  ownerPersonId: string | null;
  ownerName: string;
  projectId: string;
  projectTitle: string;
  projectMeta: string;
  dueLabel: string;
  slotsLabel: string;
  messageText: string;
}

/**
 * After a successful apply, the backend has already created the
 * application conversation (with the apply message as its first
 * message): reload the list and return the thread's id so the
 * caller can navigate to the inbox.
 */
/* --- Pending open ------------------------------------------------
 * A Chat button or an apply elsewhere in the app hands the inbox a
 * thread id to open. The shell peeks at it while rendering (so the
 * open thread is never some other conversation for a frame) and
 * consumes it once the thread is in the loaded list, making it the
 * sticky selection. */
let pendingOpenThreadId: string | null = null;

export function requestOpenThread(id: string): void {
  pendingOpenThreadId = id;
}

export function peekPendingOpenThreadId(): string | null {
  return pendingOpenThreadId;
}

export function consumePendingOpenThreadId(): void {
  pendingOpenThreadId = null;
}

export async function startApplicationThread(
  input: OutgoingApplicationInput,
): Promise<string | null> {
  await refreshConversations();
  const thread = conversations.find(
    (t) => t.application?.projectId === input.projectId,
  );
  if (thread) requestOpenThread(thread.id);
  return thread?.id ?? null;
}

/**
 * Open the application thread for a collab (used when an
 * application notification is pressed): refresh the list, find
 * the thread by its project, and hand its id to the shell.
 */
export async function openApplicationThreadByProject(
  projectId: string,
): Promise<void> {
  await refreshConversations();
  const thread = conversations.find(
    (t) => t.application?.projectId === projectId,
  );
  if (thread) requestOpenThread(thread.id);
}

export interface DirectThreadInput {
  personId: string | null;
  name: string;
  /** The collab page the chat was opened from: an existing
   * application conversation for that collab is continued instead
   * of opening a second thread with the same person. */
  projectId?: string;
}

/**
 * "Chat with owner": find-or-create the plain 1:1 conversation on
 * the server, reload the list, and return its id. Throws on
 * failure (the caller toasts).
 */
export async function startDirectThread(
  input: DirectThreadInput,
): Promise<string | null> {
  if (!input.personId) return null;
  const summary = await ensureDirectConversation(input.personId, input.projectId);
  await refreshConversations();
  requestOpenThread(summary.id);
  return summary.id;
}
