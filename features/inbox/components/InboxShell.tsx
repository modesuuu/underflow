"use client";

import { useEffect, useMemo, useState } from "react";
import { markThreadRead, useConversations } from "../store";
import { ChatPane } from "./ChatPane";
import { MessagesColumn } from "./MessagesColumn";

/**
 * The Inbox page body: Messages rail + chat pane, driven by the
 * session inbox store. Selecting a thread marks it read (the Sidebar
 * badge follows the same store, so it stays in sync).
 */
export function InboxShell() {
  const conversations = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (thread) =>
        thread.name.toLowerCase().includes(q) ||
        (thread.application?.projectTitle.toLowerCase().includes(q) ?? false),
    );
  }, [conversations, query]);

  const selected =
    conversations.find((thread) => thread.id === selectedId) ??
    conversations[0] ??
    null;

  useEffect(() => {
    if (selected) markThreadRead(selected.id);
  }, [selected?.id]);

  return (
    <div className="flex h-full">
      <MessagesColumn
        conversations={filtered}
        selectedId={selected?.id ?? null}
        query={query}
        onQueryChange={setQuery}
        onSelect={setSelectedId}
      />
      <ChatPane conversation={selected} />
    </div>
  );
}
