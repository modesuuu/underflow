"use client";

import { useEffect, useMemo, useState } from "react";
import { openThread, refreshConversations, useConversations } from "../store";
import { ChatPane } from "./ChatPane";
import { MessagesColumn } from "./MessagesColumn";

/**
 * The Inbox page body: Messages rail + chat pane, driven by the
 * API-backed inbox store. Selecting a thread loads its history
 * and marks it read (the Sidebar badge follows the same store,
 * so it stays in sync).
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

  // The list is server-backed: load it on mount. LivePoller keeps
  // it fresh afterwards (realtime events + polling fallback).
  useEffect(() => {
    void refreshConversations();
  }, []);

  // Opening a thread fetches its history and marks it read; the
  // effect re-runs when new messages land in the open thread so
  // they are read while the user is looking at them.
  useEffect(() => {
    if (selected) void openThread(selected.id);
  }, [selected?.id, selected?.messages.length]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Below lg the inbox is single-pane: the rail and the chat
          take turns filling the screen, switched by selectedId. */}
      <MessagesColumn
        conversations={filtered}
        selectedId={selected?.id ?? null}
        query={query}
        onQueryChange={setQuery}
        onSelect={setSelectedId}
        className={selectedId ? "max-lg:hidden" : undefined}
      />
      <ChatPane
        conversation={selected}
        onBack={() => setSelectedId(null)}
        className={selectedId ? undefined : "max-lg:hidden"}
      />
    </div>
  );
}
