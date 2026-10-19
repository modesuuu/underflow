"use client";

import { useSyncExternalStore } from "react";
import { buildCircleData, eligibleProjects } from "./mock";
import type {
  ChannelId,
  CircleAttachment,
  CircleData,
  CircleMessage,
} from "./types";

/**
 * Session-scoped Circle state (spec-circle-v1 §4), same external-store
 * idiom as the like-store and notifications-store: seeds once from the
 * mock, every write replaces the record and emits, nothing persists
 * across a refresh. TODO(backend): the seed becomes the REST history
 * fetch and the writes become WebSocket events (spec §12).
 */

let circles: Record<string, CircleData> | null = null;

function seed(): Record<string, CircleData> {
  if (!circles) {
    circles = {};
    for (const project of eligibleProjects()) {
      circles[project.id] = buildCircleData(project);
    }
  }
  return circles;
}

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

export function useCircles(): Record<string, CircleData> {
  return useSyncExternalStore(subscribe, () => seed(), () => seed());
}

export function useCircle(projectId: string): CircleData | undefined {
  const all = useCircles();
  return all[projectId];
}

function update(projectId: string, fn: (data: CircleData) => CircleData) {
  const all = seed();
  const current = all[projectId];
  if (!current) return;
  const next = fn(current);
  if (next === current) return;
  circles = { ...all, [projectId]: next };
  emit();
}

function updateMessage(
  projectId: string,
  messageId: string,
  fn: (message: CircleMessage) => CircleMessage,
) {
  update(projectId, (data) => {
    if (!data.messages.some((m) => m.id === messageId)) return data;
    return {
      ...data,
      messages: data.messages.map((m) => (m.id === messageId ? fn(m) : m)),
    };
  });
}

/** Unread = user messages after lastRead (system messages never count). */
export function channelUnread(data: CircleData, channelId: ChannelId): number {
  const messages = data.messages.filter((m) => m.channelId === channelId);
  const lastReadId = data.lastRead[channelId];
  const start =
    lastReadId === null
      ? 0
      : messages.findIndex((m) => m.id === lastReadId) + 1;
  return messages.slice(start).filter((m) => m.kind === "user").length;
}

/** Unread messages that mention the current user ("@Username"). */
export function channelMentions(data: CircleData, channelId: ChannelId): number {
  const me = data.members.find((m) => m.userId === "me");
  if (!me) return 0;
  const needle = `@${me.name}`;
  const messages = data.messages.filter((m) => m.channelId === channelId);
  const lastReadId = data.lastRead[channelId];
  const start =
    lastReadId === null
      ? 0
      : messages.findIndex((m) => m.id === lastReadId) + 1;
  return messages
    .slice(start)
    .filter((m) => m.kind === "user" && m.authorId !== "me" && m.body.includes(needle))
    .length;
}

export function markChannelRead(projectId: string, channelId: ChannelId) {
  update(projectId, (data) => {
    const messages = data.messages.filter((m) => m.channelId === channelId);
    const last = messages[messages.length - 1];
    if (!last || data.lastRead[channelId] === last.id) return data;
    return { ...data, lastRead: { ...data.lastRead, [channelId]: last.id } };
  });
}

let messageSeq = 0;

export function sendMessage(
  projectId: string,
  channelId: ChannelId,
  input: {
    body: string;
    replyToId?: string;
    attachments: CircleAttachment[];
  },
) {
  const body = input.body.trim();
  if (!body && input.attachments.length === 0) return;
  messageSeq += 1;
  const message: CircleMessage = {
    id: `${projectId}-sent-${messageSeq}`,
    channelId,
    authorId: "me",
    kind: "user",
    body,
    createdAt: new Date().toISOString(),
    replyToId: input.replyToId,
    reactions: [],
    pinned: false,
    attachments: input.attachments,
  };
  update(projectId, (data) => ({
    ...data,
    messages: [...data.messages, message],
    lastRead: { ...data.lastRead, [channelId]: message.id },
  }));
}

export function editMessage(projectId: string, messageId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  updateMessage(projectId, messageId, (m) => ({
    ...m,
    body: trimmed,
    editedAt: new Date().toISOString(),
  }));
}

export function deleteMessage(projectId: string, messageId: string) {
  update(projectId, (data) => ({
    ...data,
    messages: data.messages.filter((m) => m.id !== messageId),
  }));
}

export function toggleReaction(
  projectId: string,
  messageId: string,
  emoji: string,
) {
  updateMessage(projectId, messageId, (m) => {
    const existing = m.reactions.find((r) => r.emoji === emoji);
    if (!existing) {
      return {
        ...m,
        reactions: [...m.reactions, { emoji, count: 1, reactedByMe: true }],
      };
    }
    if (existing.reactedByMe) {
      const reactions =
        existing.count <= 1
          ? m.reactions.filter((r) => r.emoji !== emoji)
          : m.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, reactedByMe: false }
                : r,
            );
      return { ...m, reactions };
    }
    return {
      ...m,
      reactions: m.reactions.map((r) =>
        r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r,
      ),
    };
  });
}

export function togglePin(projectId: string, messageId: string) {
  updateMessage(projectId, messageId, (m) => ({ ...m, pinned: !m.pinned }));
}

export function deleteResource(projectId: string, resourceId: string) {
  update(projectId, (data) => ({
    ...data,
    resources: data.resources.filter((r) => r.id !== resourceId),
  }));
}

/** Right-panel UI state: session-scoped, shared by header and panel. */
export type CirclePanelTab = "team" | "resources";

interface PanelState {
  /** null = follow the viewport default (open at >=1280px). */
  open: boolean | null;
  tab: CirclePanelTab;
}

let panelState: PanelState = { open: null, tab: "team" };
const panelListeners = new Set<() => void>();

function emitPanel() {
  for (const listener of panelListeners) listener();
}

function subscribePanel(listener: () => void) {
  panelListeners.add(listener);
  return () => {
    panelListeners.delete(listener);
  };
}

export function usePanelState(): PanelState {
  return useSyncExternalStore(
    subscribePanel,
    () => panelState,
    () => panelState,
  );
}

export function setPanelOpen(open: boolean) {
  if (panelState.open === open) return;
  panelState = { ...panelState, open };
  emitPanel();
}

export function setPanelTab(tab: CirclePanelTab) {
  if (panelState.tab === tab) return;
  panelState = { ...panelState, tab };
  emitPanel();
}
