"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { markChannelRead } from "../store";
import { MessageGroup } from "./MessageGroup";
import { formatTime } from "./MessageItem";
import type { ChannelId, CircleData, CircleMember, CircleMessage } from "../types";

type Block =
  | { type: "date"; key: string; label: string }
  | { type: "new"; key: string }
  | { type: "system"; key: string; message: CircleMessage }
  | { type: "group"; key: string; author: CircleMember | undefined; messages: CircleMessage[] };

const SEVEN_MINUTES = 7 * 60 * 1000;

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The message timeline (spec §5.1): date separators, <7-minute grouping,
 * system messages centered, and the NEW divider computed from the
 * lastRead value frozen at mount (opening the channel marks it read for
 * the next visit; the divider belongs to this one).
 */
export function MessageTimeline({
  projectId,
  channelId,
  data,
}: {
  projectId: string;
  channelId: ChannelId;
  data: CircleData;
}) {
  const [frozenLastRead] = useState(() => data.lastRead[channelId]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const lastCountRef = useRef(0);
  const [showJump, setShowJump] = useState(false);

  const membersById = useMemo(
    () => new Map(data.members.map((m) => [m.userId, m])),
    [data.members],
  );
  const messagesById = useMemo(
    () => new Map(data.messages.map((m) => [m.id, m])),
    [data.messages],
  );

  const channelMessages = useMemo(
    () => data.messages.filter((m) => m.channelId === channelId),
    [data.messages, channelId],
  );

  const blocks = useMemo<Block[]>(() => {
    const out: Block[] = [];
    const frozenIndex =
      frozenLastRead === null
        ? -1
        : channelMessages.findIndex((m) => m.id === frozenLastRead);
    const firstUnread = channelMessages.find(
      (m, i) => i > frozenIndex && m.kind === "user",
    );
    let lastDay = "";
    let group: Extract<Block, { type: "group" }> | null = null;
    for (const message of channelMessages) {
      const day = dayKey(message.createdAt);
      if (day !== lastDay) {
        out.push({ type: "date", key: `date-${day}`, label: dayLabel(message.createdAt) });
        lastDay = day;
        group = null;
      }
      if (firstUnread && message.id === firstUnread.id) {
        out.push({ type: "new", key: "new-divider" });
        group = null;
      }
      if (message.kind === "system") {
        out.push({ type: "system", key: message.id, message });
        group = null;
        continue;
      }
      const author = membersById.get(message.authorId);
      const lastInGroup = group?.messages[group.messages.length - 1];
      if (
        group &&
        lastInGroup &&
        group.author?.userId === message.authorId &&
        new Date(message.createdAt).getTime() - new Date(lastInGroup.createdAt).getTime() < SEVEN_MINUTES
      ) {
        group.messages.push(message);
      } else {
        group = { type: "group", key: message.id, author, messages: [message] };
        out.push(group);
      }
    }
    return out;
  }, [channelMessages, frozenLastRead, membersById]);

  // Opening the channel marks it read (the badge clears immediately;
  // the NEW divider stays for this visit because it uses the frozen copy).
  useEffect(() => {
    markChannelRead(projectId, channelId);
  }, [projectId, channelId]);

  // Scroll to the latest message on open.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    lastCountRef.current = channelMessages.length;
    nearBottomRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, channelId]);

  // New messages: follow them only while the user is near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (channelMessages.length > lastCountRef.current) {
      const last = channelMessages[channelMessages.length - 1];
      if (nearBottomRef.current || last?.authorId === "me") {
        el.scrollTop = el.scrollHeight;
        setShowJump(false);
      } else {
        setShowJump(true);
      }
    }
    lastCountRef.current = channelMessages.length;
  }, [channelMessages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottomRef.current) setShowJump(false);
  };

  const hasUserMessages = channelMessages.some((m) => m.kind === "user");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-4"
        role="log"
        aria-label={`Messages in #${channelId}`}
      >
        {!hasUserMessages && channelMessages.length <= 1 && (
          <p className="px-4 pt-10 text-center text-sm text-muted">
            {channelId === "general"
              ? "No messages yet. Say hello to your team."
              : "No announcements yet."}
          </p>
        )}
        {blocks.map((block) => {
          if (block.type === "date") {
            return (
              <div key={block.key} className="flex items-center gap-3 px-4 pt-5">
                <span className="h-px flex-1 bg-line/60" />
                <span className="text-xs font-medium text-subtle">{block.label}</span>
                <span className="h-px flex-1 bg-line/60" />
              </div>
            );
          }
          if (block.type === "new") {
            return (
              <div key={block.key} className="flex items-center gap-3 px-4 pt-4" aria-label="Unread messages below">
                <span className="h-px flex-1 bg-badge/50" />
                <span className="text-xs font-semibold text-badge">NEW</span>
                <span className="h-px flex-1 bg-badge/50" />
              </div>
            );
          }
          if (block.type === "system") {
            return (
              <p key={block.key} className="px-4 pt-3 text-center text-xs text-subtle">
                {block.message.body}{" "}
                <span aria-hidden>· {formatTime(block.message.createdAt)}</span>
              </p>
            );
          }
          return (
            <MessageGroup
              key={block.key}
              projectId={projectId}
              author={block.author}
              messages={block.messages}
              membersById={membersById}
              messagesById={messagesById}
            />
          );
        })}
      </div>
      {showJump && (
        <button
          type="button"
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
            setShowJump(false);
          }}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-surface shadow-[0_8px_20px_-8px_rgba(var(--uf-shadow-rgb),0.4)] transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Icon name="chevron-down" size={14} />
          New messages
        </button>
      )}
    </div>
  );
}
