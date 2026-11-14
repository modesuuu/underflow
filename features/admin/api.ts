import { ApiEnvelope, apiFetch } from "@/lib/api-client";
import { localeTag } from "@/lib/i18n/format";
import type {
  ActionRequestRow,
  AdminContentType,
  AdminOverview,
  AdminPage,
  AdminContentItem,
  AdminUserDetail,
  AdminUserRow,
  ReportGroup,
  AdminAppealRow,
} from "./types";

/**
 * Admin API transport (spec-admin.md §8). Every call rides the
 * session token via apiFetch; the backend AdminMiddleware is the
 * real gate — a 403 here means the account has no admin role.
 */

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await apiFetch<ApiEnvelope<AdminOverview>>("/api/admin/overview");
  return res.data;
}

export interface AdminUsersQuery {
  q?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export async function getAdminUsers(
  query: AdminUsersQuery
): Promise<AdminPage<AdminUserRow>> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.role && query.role !== "all") params.set("role", query.role);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  const res = await apiFetch<ApiEnvelope<AdminPage<AdminUserRow>>>(
    `/api/admin/users?${params.toString()}`
  );
  return res.data;
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const res = await apiFetch<ApiEnvelope<AdminUserDetail>>(
    `/api/admin/users/${id}`
  );
  return res.data;
}

export interface AdminContentQuery {
  state?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getAdminContent(
  type: AdminContentType,
  query: AdminContentQuery
): Promise<AdminPage<AdminContentItem>> {
  const params = new URLSearchParams();
  if (query.state && query.state !== "all") params.set("state", query.state);
  if (query.q) params.set("q", query.q);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  const res = await apiFetch<ApiEnvelope<AdminPage<AdminContentItem>>>(
    `/api/admin/content/${type}?${params.toString()}`
  );
  return res.data;
}

// ── Fase 2: moderation writes ──────────────────────────────────────

export interface AdminActionInput {
  action_type: string;
  target_type?: string;
  target_id: string;
  reason?: string;
  with_strike?: boolean;
}

/** Direct execution — Super Admin only (backend enforces). */
export async function postAdminAction(
  input: AdminActionInput
): Promise<{ action_id: string }> {
  const res = await apiFetch<ApiEnvelope<{ action_id: string }>>(
    "/api/admin/actions",
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}

/** A monitor's proposal — executes only after Super Admin approval. */
export async function postActionRequest(input: {
  action_type: string;
  target_id: string;
  reason: string;
  with_strike?: boolean;
}): Promise<{ id: string }> {
  const res = await apiFetch<ApiEnvelope<{ id: string }>>(
    "/api/admin/action-requests",
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}

export async function getActionRequests(
  status?: string
): Promise<ActionRequestRow[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await apiFetch<ApiEnvelope<{ items: ActionRequestRow[] }>>(
    `/api/admin/action-requests${qs}`
  );
  return res.data?.items ?? [];
}

export async function decideActionRequest(
  id: string,
  decision: "approved" | "rejected",
  note?: string
): Promise<void> {
  await apiFetch(`/api/admin/action-requests/${id}/decide`, {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  });
}

export async function getAdminReports(): Promise<ReportGroup[]> {
  const res = await apiFetch<ApiEnvelope<{ groups: ReportGroup[] }>>(
    "/api/admin/reports"
  );
  return res.data?.groups ?? [];
}

/** Direct report dismissal — Super Admin only. */
export async function dismissReport(
  reportId: string,
  reason?: string
): Promise<void> {
  await apiFetch(`/api/admin/reports/${reportId}/dismiss`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}

/** Backend timestamps arrive as "YYYY-MM-DD HH:mm:ss" — normalize. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(localeTag(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString(localeTag(), {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString(localeTag(), { hour: "2-digit", minute: "2-digit" })
  );
}

export async function getAdminAppeals(): Promise<AdminAppealRow[]> {
  const res = await apiFetch<ApiEnvelope<{ appeals: AdminAppealRow[] }>>(
    "/api/admin/appeals",
  );
  return res.data.appeals;
}

export async function decideAppeal(
  id: string,
  decision: "granted" | "denied",
  note?: string,
): Promise<void> {
  await apiFetch("/api/admin/appeals/" + id + "/decide", {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  });
}
