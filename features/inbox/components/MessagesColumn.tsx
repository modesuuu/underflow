"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { clearThread, deleteThread, unreadCount } from "../store";
import type { Conversation } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ThreadOptionsMenu } from "./ThreadOptionsMenu";

interface MessagesColumnProps {
  conversations: Conversation[];
  selectedId: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}

type ConfirmState = { kind: "clear" | "delete"; thread: Conversation } | null;

/**
 * Left rail of the Inbox (Figma 386:5), WhatsApp-Web model: title
 * and search stay fixed, ONLY the list scrolls, hint pinned at the
 * bottom. Pinned threads sort first (the store keeps the rest in
 * latest-activity order). Every row carries the kebab menu with the
 * thread actions; the destructive ones (Clear, Delete) confirm
 * through a dialog owned here.
 */
export function MessagesColumn({
  conversations,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: MessagesColumnProps) {
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const sorted = [...conversations].sort(
    (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false),
  );

  return (
    <section
      aria-label="Conversations"
      className="flex h-full w-[336px] shrink-0 flex-col border-r border-line bg-bg"
    >
      <div className="flex shrink-0 flex-col gap-5 px-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[28px] font-bold text-ink">Messages</h2>
          <span className="text-muted">
            <Icon name="dots-vertical-rounded" size={24} />
          </span>
        </div>

        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search"
            className="h-[42px] w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </div>

      <ul className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-2">
        {sorted.map((thread, index) => {
          const last = thread.messages[thread.messages.length - 1];
          const selected = thread.id === selectedId;
          const threadUnread = unreadCount(thread);
          const unread = threadUnread > 0;
          return (
            <li key={thread.id}>
              <div
                className={`flex items-center rounded-xl pr-1 transition-colors ${
                  selected ? "bg-surface" : "hover:bg-surface/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  aria-current={selected || undefined}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-2 py-2 text-left"
                >
                  <Avatar size={42} alt={thread.name} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-base leading-snug font-medium text-ink">
                        {thread.name}
                      </span>
                      {thread.pinned && (
                        <Icon
                          name="pin"
                          size={14}
                          className="shrink-0 text-muted"
                        />
                      )}
                      {thread.muted && (
                        <Icon
                          name="bell-off"
                          size={14}
                          className="shrink-0 text-muted"
                        />
                      )}
                    </span>
                    <span
                      className={`truncate text-[13px] leading-snug ${
                        unread ? "font-medium text-ink" : "text-muted"
                      }`}
                    >
                      {last
                        ? `${last.from === "me" ? "You: " : ""}${last.text}`
                        : "No messages yet"}
                    </span>
                  </span>
                  <span className="flex h-[42px] flex-col items-end justify-between py-0.5">
                    <span className="text-[11px] leading-none font-medium text-muted">
                      {last?.timeLabel ?? ""}
                    </span>
                    {unread ? (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] leading-none font-semibold text-ink">
                        {threadUnread}
                      </span>
                    ) : (
                      <span className="h-[18px]" />
                    )}
                  </span>
                </button>
                <ThreadOptionsMenu
                  thread={thread}
                  onClearRequest={(t) => setConfirm({ kind: "clear", thread: t })}
                  onDeleteRequest={(t) =>
                    setConfirm({ kind: "delete", thread: t })
                  }
                />
              </div>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <li className="px-2 text-sm text-muted">
            No conversations match your search.
          </li>
        )}
      </ul>

      <p className="shrink-0 px-6 pt-2 pb-6 text-sm text-muted">
        Chat with applicants
      </p>

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "delete" ? "Delete chat" : "Clear chat"}
          description={
            confirm.kind === "delete"
              ? `Are you sure you want to delete the chat with ${confirm.thread.name}? This action cannot be undone.`
              : `Are you sure you want to clear the chat with ${confirm.thread.name}? The conversation and its application stay here. This action cannot be undone.`
          }
          confirmLabel={confirm.kind === "delete" ? "Delete chat" : "Clear chat"}
          onConfirm={() => {
            if (confirm.kind === "delete") deleteThread(confirm.thread.id);
            else clearThread(confirm.thread.id);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
