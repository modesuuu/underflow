import { countUnread, getConversationsList } from "./store";
import type { Conversation, InboxSummary } from "./types";

// TODO(backend): replace with GET /api/inbox/summary and
// GET /api/inbox/conversations (docs/api-contract.md "Inbox" — was
// missing from the earlier draft, audit P1-A #12). Until the API
// exists, both read the session inbox store (empty until the user
// applies or chats) so the Sidebar badge and the Inbox page agree.
export async function getInboxSummary(): Promise<InboxSummary> {
  return { unreadCount: countUnread(getConversationsList()) };
}

export async function getConversations(): Promise<Conversation[]> {
  return getConversationsList();
}
