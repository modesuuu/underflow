import { useSyncExternalStore } from "react";
import { CONVERSATIONS_SEED } from "./mock";
import type { ApplicationStatus, Conversation } from "./types";

/**
 * Session-scoped inbox store — same pattern as the dashboard
 * like-store: module state + listeners + useSyncExternalStore, so the
 * thread list, the open chat, and the Sidebar unread badge all read
 * one source and never drift apart.
 *
 * TODO(backend): state lives in session memory and dies on refresh.
 * Real persistence waits on the inbox API (docs/api-contract.md).
 */

let conversations: Conversation[] = CONVERSATIONS_SEED;
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

function getSnapshot(): Conversation[] {
  return conversations;
}

export function useConversations(): Conversation[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function countUnread(list: Conversation[]): number {
  return list.reduce((sum, thread) => sum + thread.unread, 0);
}

export function useInboxUnreadCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => countUnread(conversations),
    () => countUnread(CONVERSATIONS_SEED),
  );
}

function replaceThread(id: string, update: (thread: Conversation) => Conversation) {
  conversations = conversations.map((thread) =>
    thread.id === id ? update(thread) : thread,
  );
  emit();
}

export function markThreadRead(id: string) {
  const thread = conversations.find((t) => t.id === id);
  if (!thread || thread.unread === 0) return;
  replaceThread(id, (t) => ({ ...t, unread: 0 }));
}

let messageSeq = 0;

export function sendMessage(threadId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  messageSeq += 1;
  replaceThread(threadId, (t) => ({
    ...t,
    messages: [
      ...t.messages,
      {
        id: `${threadId}-sent-${messageSeq}`,
        from: "me" as const,
        text: trimmed,
        timeLabel: "now",
      },
    ],
  }));
}

export function resolveApplication(
  threadId: string,
  status: Extract<ApplicationStatus, "accepted" | "declined">,
) {
  replaceThread(threadId, (t) =>
    t.application
      ? { ...t, application: { ...t.application, status } }
      : t,
  );
}

export function withdrawApplication(projectId: string) {
  const thread = conversations.find(
    (t) => t.application?.projectId === projectId && t.application.direction === "outgoing",
  );
  if (!thread || !thread.application || thread.application.status !== "pending") return;
  replaceThread(thread.id, (t) => ({
    ...t,
    application: t.application ? { ...t.application, status: "withdrawn" } : t.application,
  }));
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
 * The apply flow lands here: applying to a project opens (or reuses)
 * the thread with its owner, appends the applicant's message, and
 * attaches the outgoing application card. Returns the thread id so
 * the caller can navigate straight to it.
 */
export function startApplicationThread(input: OutgoingApplicationInput): string {
  const existing = conversations.find(
    (t) => t.application?.projectId === input.projectId,
  );
  messageSeq += 1;
  const message = {
    id: `apply-${input.projectId}-${messageSeq}`,
    from: "me" as const,
    text: input.messageText,
    timeLabel: "now",
  };
  if (existing) {
    replaceThread(existing.id, (t) => ({
      ...t,
      messages: [...t.messages, message],
      application: t.application
        ? { ...t.application, status: "pending" }
        : t.application,
    }));
    return existing.id;
  }
  const byOwner = conversations.find((t) => t.name === input.ownerName);
  if (byOwner && !byOwner.application) {
    replaceThread(byOwner.id, (t) => ({
      ...t,
      messages: [...t.messages, message],
      application: {
        projectId: input.projectId,
        projectTitle: input.projectTitle,
        projectMeta: input.projectMeta,
        dueLabel: input.dueLabel,
        slotsLabel: input.slotsLabel,
        direction: "outgoing",
        status: "pending",
      },
    }));
    return byOwner.id;
  }
  const id = `t-apply-${input.projectId}`;
  conversations = [
    {
      id,
      personId: input.ownerPersonId,
      name: input.ownerName,
      unread: 0,
      messages: [message],
      application: {
        projectId: input.projectId,
        projectTitle: input.projectTitle,
        projectMeta: input.projectMeta,
        dueLabel: input.dueLabel,
        slotsLabel: input.slotsLabel,
        direction: "outgoing",
        status: "pending",
      },
    },
    ...conversations,
  ];
  emit();
  return id;
}
