import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import { INBOX_SUMMARY } from "./mock";
import type { InboxSummary } from "./types";

// TODO(backend): replace with GET /api/inbox/summary (docs/api-contract.md
// "Inbox" — was missing from the earlier draft, audit P1-A #12).
export async function getInboxSummary(): Promise<InboxSummary> {
  if (!isApiConfigured()) {
    return INBOX_SUMMARY;
  }
  const res = await apiFetch<ApiEnvelope<InboxSummary>>("/api/inbox/summary");
  return res.data;
}