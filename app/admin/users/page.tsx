"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { fmtDate, getAdminUsers } from "@/features/admin/api";
import type { AdminPage, AdminUserRow } from "@/features/admin/types";
import {
  AccountPill,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  RoleLabel,
  TABLE_WRAP,
  TD,
  TH,
} from "@/features/admin/components/ui";

/**
 * Admin Users (spec-admin.md §7): searchable, filterable,
 * paginated table of every account. Read-only in Fase 1 —
 * moderation actions arrive in Fase 2.
 */

const SELECT_CLASS =
  "cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPage<AdminUserRow> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setError(false);
    getAdminUsers({ q: debouncedQ, status, role, page, limit: 20 })
      .then(setData)
      .catch(() => setError(true));
  }, [debouncedQ, status, role, page, attempt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Users" subtitle="Every account on the platform.">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
            <Icon name="search" size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search username or email"
              className="w-52 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
            aria-label="Account status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
            aria-label="Role"
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="monitor">Monitor</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
      ) : data === null ? (
        <div className={`${TABLE_WRAP} px-4 py-10 text-center text-sm text-muted`}>
          Loading users...
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState>No users match this filter.</EmptyState>
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>User</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Sign-in</th>
                  <th className={TH}>Joined</th>
                  <th className={TH}>Posts</th>
                  <th className={TH}>Collabs</th>
                  <th className={TH}>Strikes</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-b-0 hover:bg-bg">
                    <td className={TD}>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <Avatar
                          size={30}
                          src={u.photo_profile_url ?? undefined}
                          alt={u.username}
                        />
                        <span className="font-medium hover:underline">
                          {u.username}
                        </span>
                      </Link>
                    </td>
                    <td className={`${TD} text-muted`}>{u.email}</td>
                    <td className={`${TD} text-muted`}>
                      {u.provider === "google" ? "Google" : "Password"}
                    </td>
                    <td className={`${TD} text-muted`}>{fmtDate(u.created_at)}</td>
                    <td className={TD}>{u.post_count}</td>
                    <td className={TD}>{u.collab_count}</td>
                    <td className={TD}>
                      {u.strike_count > 0 ? (
                        <span
                          className="font-semibold"
                          style={{ color: "var(--color-error, #c9303a)" }}
                        >
                          {u.strike_count}
                        </span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className={TD}>
                      <RoleLabel role={u.role} />
                    </td>
                    <td className={TD}>
                      <AccountPill status={u.account_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            total={data.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}
