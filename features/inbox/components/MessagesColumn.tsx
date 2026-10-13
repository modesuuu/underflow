"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { Conversation } from "../types";

interface MessagesColumnProps {
  conversations: Conversation[];
  selectedId: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}

/**
 * Left column of the Inbox (Figma 386:5): gray 336px rail with the
 * "Messages" title, a search field, the conversation list, and the
 * "Chat with applicants" hint. Conversation rows follow the frame:
 * avatar + name/preview, time + unread badge + kebab on the right.
 */
export function MessagesColumn({
  conversations,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: MessagesColumnProps) {
  return (
    <section
      aria-label="Conversations"
      className="no-scrollbar flex w-[336px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-bg p-6"
    >
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
          className="h-[42px] w-full rounded-md border border-line bg-surface pr-3 pl-9 text-sm text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <ul className="flex flex-col gap-3">
        {conversations.map((thread) => {
          const last = thread.messages[thread.messages.length - 1];
          const selected = thread.id === selectedId;
          return (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => onSelect(thread.id)}
                aria-current={selected || undefined}
                className="flex w-full cursor-pointer items-center gap-3 px-0 py-0 text-left transition-colors hover:bg-surface/60"
              >
                <Avatar size={42} alt={thread.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base leading-snug font-medium text-ink">
                    {thread.name}
                  </span>
                  <span className="truncate text-sm leading-snug text-muted">
                    {last?.text ?? ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="flex items-center gap-1">
                    <span className="text-2xs text-subtle">
                      {last?.timeLabel ?? ""}
                    </span>
                    <span className="text-muted">
                      <Icon name="dots-vertical-rounded" size={18} />
                    </span>
                  </span>
                  {thread.unread > 0 && (
                    <Badge count={thread.unread} tone="danger" shape="pill" />
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <li className="text-sm text-muted">No conversations match your search.</li>
        )}
      </ul>

      <p className="text-sm text-muted">Chat with applicants</p>
    </section>
  );
}
