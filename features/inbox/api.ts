import { CONVERSATIONS_SEED } from "./mock";
import { countUnread } from "./store";
import type { Conversation, InboxSummary } from "./types";

// TODO(backend): replace with GET /api/inbox/summary and
// GET /api/inbox/conversations (docs/api-contract.md "Inbox" — was
// missing from the earlier draft, audit P1-A #12). Until the API
// exists, the summary is computed from the session inbox store's
// seed so the Sidebar badge and the Inbox page agree.
export async function getInboxSummary(): Promise<InboxSummary> {
  return { unreadCount: countUnread(CONVERSATIONS_SEED) };
}

export async function getConversations(): Promise<Conversation[]> {
  return CONVERSATIONS_SEED;
}
