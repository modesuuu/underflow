"use client";

import { Avatar } from "@/components/ui/Avatar";
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
 * Left rail of the Inbox (Figma 386:5), laid out WhatsApp-Web style:
 * the title and search stay fixed, ONLY the conversation list
 * scrolls, and the hint sits at the bottom. Rows are exactly
 * avatar-height; the right block follows the frame — a time (8px)
 * pinned above the unread badge (lime pill, 8px) with a 24px kebab
 * centered 12px to their right.
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
      className="flex h-full w-[336px] shrink-0 flex-col border-r border-line bg-bg"
    >
      <div className="flex shrink-0 flex-col gap-6 px-6 pt-6">
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
      </div>

      <ul className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-6 pt-6 pb-2">
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
                  <span className="truncate text-xs leading-snug text-muted">
                    {last?.text ?? ""}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="flex h-[42px] flex-col items-center justify-between py-2">
                    <span className="text-[8px] leading-none font-medium text-ink">
                      {last?.timeLabel ?? ""}
                    </span>
                    {thread.unread > 0 ? (
                      <span className="flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-accent px-1 text-[8px] leading-none text-ink">
                        {thread.unread}
                      </span>
                    ) : (
                      <span className="h-[14px]" />
                    )}
                  </span>
                  <span className="text-muted">
                    <Icon name="dots-vertical-rounded" size={24} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <li className="text-sm text-muted">No conversations match your search.</li>
        )}
      </ul>

      <p className="shrink-0 px-6 pt-2 pb-6 text-sm text-muted">
        Chat with applicants
      </p>
    </section>
  );
}
