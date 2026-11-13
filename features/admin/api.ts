import { ApiEnvelope, apiFetch } from "@/lib/api-client";
import type {
  AdminContentType,
  AdminOverview,
  AdminPage,
  AdminContentItem,
  AdminUserDetail,
  AdminUserRow,
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

/** Backend timestamps arrive as "YYYY-MM-DD HH:mm:ss" — normalize. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
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
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}
