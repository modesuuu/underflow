import { apiFetch, isApiConfigured } from "@/lib/api-client";
import { INBOX_SUMMARY } from "./mock";
import type { InboxSummary } from "./types";

// TODO(backend): replace with GET /api/inbox/summary
export async function getInboxSummary(): Promise<InboxSummary> {
  if (!isApiConfigured()) {
    return INBOX_SUMMARY;
  }
  return apiFetch<InboxSummary>("/api/inbox/summary");
}