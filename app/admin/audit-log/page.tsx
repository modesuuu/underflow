"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { fmtDateTime, getAuditLog } from "@/features/admin/api";
import type { AdminAuditPage } from "@/features/admin/types";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Pill,
  TABLE_WRAP,
  TD,
  TH,
} from "@/features/admin/components/ui";

/**
 * Admin Audit Log (spec-admin.md §7.7, audit P1 #7): the full
 * moderation_actions table, read-only for every admin role,
 * filterable by actor, target type, and action type.
 */

const SELECT_CLASS =
  "cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink";

const ACTION_LABEL: Record<string, DictKey> = {
  remove_post: "admin.actRemovePost",
  remove_comment: "admin.actRemoveComment",
  remove_collab: "admin.actRemoveCollab",
  suspend_user: "admin.actSuspend",
  dismiss_report: "admin.actDismiss",
  restore_content: "admin.actRestore",
  unsuspend_user: "admin.actUnsuspend",
  grant_appeal: "admin.actGrantAppeal",
  deny_appeal: "admin.actDenyAppeal",
};
const ACTION_TYPES = Object.keys(ACTION_LABEL);

const TARGET_LABEL: Record<string, DictKey> = {
  post: "admin.targetPost",
  comment: "admin.targetComment",
  collab: "admin.targetCollab",
  user: "admin.targetUser",
  report: "admin.targetReport",
};
const TARGET_TYPES = Object.keys(TARGET_LABEL);

export default function AdminAuditLogPage() {
  const { t } = useLanguage();
  const [actionType, setActionType] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [actorId, setActorId] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminAuditPage | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setError(false);
    getAuditLog({
      actionType: actionType === "all" ? undefined : actionType,
      targetType: targetType === "all" ? undefined : targetType,
      actorId: actorId === "all" ? undefined : actorId,
      page,
      limit: 20,
    })
      .then(setData)
      .catch(() => setError(true));
  }, [actionType, targetType, actorId, page, attempt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title={t("admin.auditTitle")} subtitle={t("admin.auditSubtitle")}>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={actionType}
            onChange={(e) => {
              setActionType(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
            aria-label={t("admin.auditAction")}
          >
            <option value="all">{t("admin.auditAllActions")}</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {t(ACTION_LABEL[a])}
              </option>
            ))}
          </select>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
            aria-label={t("admin.auditTarget")}
          >
            <option value="all">{t("admin.auditAllTargets")}</option>
            {TARGET_TYPES.map((a) => (
              <option key={a} value={a}>
                {t(TARGET_LABEL[a])}
              </option>
            ))}
          </select>
          <select
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setPage(1);
            }}
            className={SELECT_CLASS}
            aria-label={t("admin.auditActor")}
          >
            <option value="all">{t("admin.auditAllActors")}</option>
            {(data?.actors ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.username}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
      ) : !data ? (
        <p className="text-sm text-muted">{t("admin.loading")}</p>
      ) : data.items.length === 0 ? (
        <EmptyState>{t("admin.auditEmpty")}</EmptyState>
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>{t("admin.auditWhen")}</th>
                  <th className={TH}>{t("admin.auditActor")}</th>
                  <th className={TH}>{t("admin.auditAction")}</th>
                  <th className={TH}>{t("admin.auditTarget")}</th>
                  <th className={TH}>{t("admin.auditOwner")}</th>
                  <th className={TH}>{t("admin.auditReason")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-b-0">
                    <td className={TD}>
                      <span className="text-[13px] text-muted">
                        {fmtDateTime(e.created_at)}
                      </span>
                    </td>
                    <td className={TD}>
                      <Link
                        href={"/admin/users/" + e.actor_id}
                        className="font-medium hover:underline"
                      >
                        {e.actor_name}
                      </Link>
                      {e.requested_by_name && (
                        <span className="block text-[12px] text-subtle">
                          {t("admin.auditRequestedBy", { name: e.requested_by_name })}
                        </span>
                      )}
                    </td>
                    <td className={TD}>
                      <span>
                        {ACTION_LABEL[e.action_type]
                          ? t(ACTION_LABEL[e.action_type])
                          : e.action_type}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {Number(e.strike) === 1 && (
                          <Pill tone="danger">{t("admin.strike")}</Pill>
                        )}
                        {e.reverted_at && (
                          <Pill tone="neutral">{t("admin.auditReverted")}</Pill>
                        )}
                      </span>
                    </td>
                    <td className={TD}>
                      {TARGET_LABEL[e.target_type]
                        ? t(TARGET_LABEL[e.target_type])
                        : e.target_type}
                    </td>
                    <td className={TD}>
                      {e.owner_name ? (
                        e.target_owner_id ? (
                          <Link
                            href={"/admin/users/" + e.target_owner_id}
                            className="font-medium hover:underline"
                          >
                            {e.owner_name}
                          </Link>
                        ) : (
                          e.owner_name
                        )
                      ) : (
                        <span className="text-subtle">-</span>
                      )}
                    </td>
                    <td className={TD}>
                      <span className="block truncate text-muted" title={e.reason ?? ""}>
                        {e.reason || "-"}
                      </span>
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
