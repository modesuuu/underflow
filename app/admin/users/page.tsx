"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "@/features/admin/components/AdminShell";
import { ModerationForm } from "@/features/admin/components/ModerationForm";
import { fmtDate, getAdminUsers } from "@/features/admin/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type {
  AdminPage,
  AdminUserRow,
  ModerationTarget,
} from "@/features/admin/types";
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
  const { t } = useLanguage();
  const { viewer, refreshOverview } = useAdmin();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPage<AdminUserRow> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [formTarget, setFormTarget] = useState<ModerationTarget | null>(null);

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
      <PageHeader title={t("admin.usersTitle")} subtitle={t("admin.usersSubtitle")}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
            <Icon name="search" size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("admin.searchUserPlaceholder")}
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
            aria-label={t("admin.statusAria")}
          >
            <option value="all">{t("admin.allStatuses")}</option>
            <option value="active">{t("admin.active")}</option>
            <option value="suspended">{t("admin.suspended")}</option>
          </select>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
            aria-label={t("admin.roleAria")}
          >
            <option value="all">{t("admin.allRoles")}</option>
            <option value="user">{t("admin.user")}</option>
            <option value="monitor">{t("admin.monitor")}</option>
            <option value="super_admin">{t("admin.superAdmin")}</option>
          </select>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
      ) : data === null ? (
        <div className={`${TABLE_WRAP} px-4 py-10 text-center text-sm text-muted`}>
          {t("admin.loadingUsers")}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState>{t("admin.noUsersMatch")}</EmptyState>
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-line">
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thUser")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thEmail")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thSignIn")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thJoined")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thPosts")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thCollabs")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thStrikes")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thRole")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thStatus")}</th>
                  <th className={TH + " whitespace-nowrap"}>{t("admin.thActions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-b-0 hover:bg-bg">
                    <td className={TD}>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <Avatar
                          size={30}
                          src={u.photo_profile_url ?? undefined}
                          alt={u.username}
                        />
                        <span className="truncate font-medium hover:underline">
                          {u.username}
                        </span>
                      </Link>
                    </td>
                    <td className={`${TD} truncate text-muted`}>{u.email}</td>
                    <td className={`${TD} whitespace-nowrap text-muted`}>
                      {u.provider === "google" ? "Google" : t("settings.account.password")}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-muted`}>{fmtDate(u.created_at)}</td>
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
                    <td className={TD}>
                      {u.account_status === "active" &&
                        u.role !== "super_admin" &&
                        u.id !== viewer.id && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormTarget({
                                actionType: "suspend_user",
                                targetType: "user",
                                targetId: u.id,
                                targetLabel: `@${u.username} (${u.email})`,
                              })
                            }
                            className="cursor-pointer text-[13px] font-medium"
                            style={{ color: "var(--color-error, #c9303a)" }}
                          >
                            {viewer.role === "super_admin"
                              ? t("admin.suspend")
                              : t("admin.proposeSuspension")}
                          </button>
                        )}
                      {u.account_status === "suspended" &&
                        viewer.role === "super_admin" && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormTarget({
                                actionType: "unsuspend_user",
                                targetType: "user",
                                targetId: u.id,
                                targetLabel: `@${u.username} (${u.email})`,
                              })
                            }
                            className="cursor-pointer text-[13px] font-medium text-accent"
                          >
                            {t("admin.unsuspend")}
                          </button>
                        )}
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

      <ModerationForm
        role={viewer.role}
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onDone={(message) => {
          setFormTarget(null);
          toast.success(message);
          setAttempt((n) => n + 1);
          refreshOverview();
        }}
      />
    </div>
  );
}
