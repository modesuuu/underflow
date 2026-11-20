"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAdmin } from "@/features/admin/components/AdminShell";
import { ModerationForm } from "@/features/admin/components/ModerationForm";
import { fmtDateTime, getAdminReports } from "@/features/admin/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type {
  ModerationTarget,
  ReportGroup,
} from "@/features/admin/types";
import {
  EmptyState,
  ErrorState,
  ModerationPill,
  PageHeader,
  Pill,
} from "@/features/admin/components/ui";

/**
 * Admin Reports queue (spec-admin.md §4.3): open reports grouped
 * per target, most-reported first. From a group an admin opens
 * the target, runs the fitting moderation action on it, or
 * dismisses individual reports (Super Admin directly, Monitor
 * by proposal).
 */

const TYPE_LABEL: Record<ReportGroup["target_type"], DictKey> = {
  post: "admin.typePost",
  comment: "admin.typeComment",
  collab: "admin.typeCollab",
  user: "admin.typeUser",
};

const GROUP_ACTION: Record<ReportGroup["target_type"], string> = {
  post: "remove_post",
  comment: "remove_comment",
  collab: "remove_collab",
  user: "suspend_user",
};

function viewHref(group: ReportGroup): string | null {
  if (group.target_type === "post") return `/dashboard/${group.target_id}`;
  if (group.target_type === "collab") return `/collaborations/${group.target_id}`;
  if (group.target_type === "user") return `/admin/users/${group.target_id}`;
  return null;
}

export default function AdminReportsPage() {
  const { t } = useLanguage();
  const { viewer, refreshOverview } = useAdmin();
  const [groups, setGroups] = useState<ReportGroup[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [formTarget, setFormTarget] = useState<ModerationTarget | null>(null);

  const load = useCallback(() => {
    setError(false);
    getAdminReports()
      .then(setGroups)
      .catch(() => setError(true));
  }, [attempt]);

  useEffect(() => {
    load();
  }, [load]);

  const done = (message: string) => {
    setFormTarget(null);
    toast.success(message);
    setAttempt((n) => n + 1);
    refreshOverview();
  };

  return (
    <div>
      <PageHeader
        title={t("admin.reportsTitle")}
        subtitle={t("admin.reportsSubtitle")}
      />

      {error ? (
        <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
      ) : groups === null ? (
        <p className="text-sm text-muted">{t("admin.loadingReports")}</p>
      ) : groups.length === 0 ? (
        <EmptyState>{t("admin.noOpenReports")}</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const href = viewHref(group);
            const removed = group.target_state === "removed";
            return (
              <section
                key={`${group.target_type}-${group.target_id}`}
                className="rounded-lg border border-line bg-surface px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <Pill tone="neutral">
                    {t(TYPE_LABEL[group.target_type])}
                  </Pill>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {group.target_label}
                  </span>
                  {group.owner_name && (
                    <span className="text-[13px] text-muted">
                      {t("admin.byOwner", { name: group.owner_name })}
                    </span>
                  )}
                  {removed && <ModerationPill state="removed" />}
                  <Pill tone="danger">
                    {group.open_count === 1
                      ? t("admin.reportCountOne", { count: group.open_count })
                      : t("admin.reportCountMany", { count: group.open_count })}
                  </Pill>
                </div>

                <div className="mt-3 flex flex-col divide-y divide-line border-t border-line">
                  {group.reports.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <span className="w-28 shrink-0 truncate text-muted">
                        {r.reporter_name}
                      </span>
                      <span className="min-w-0 flex-1">{r.reason}</span>
                      <span className="shrink-0 text-[13px] text-subtle">
                        {fmtDateTime(r.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormTarget({
                            actionType: "dismiss_report",
                            targetType: "report",
                            targetId: r.id,
                            targetLabel: t("admin.reportTargetLabel", { type: t(TYPE_LABEL[group.target_type]), label: group.target_label, name: r.reporter_name }),
                          })
                        }
                        className="shrink-0 cursor-pointer text-[13px] font-medium text-muted hover:text-ink"
                      >
                        {t("admin.dismiss")}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  {href ? (
                    href.startsWith("/admin") ? (
                      <Link
                        href={href}
                        className="rounded-full border border-line px-3 py-1 text-[13px] font-medium hover:text-ink"
                      >
                        {t("admin.viewTarget")}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        className="rounded-full border border-line px-3 py-1 text-[13px] font-medium hover:text-ink"
                      >
                        {t("admin.viewTarget")}
                      </a>
                    )
                  ) : null}
                  {removed ? (
                    <span className="text-[13px] text-muted">
                      {t("admin.alreadyRemoved")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setFormTarget({
                          actionType: GROUP_ACTION[group.target_type] as ModerationTarget["actionType"],
                          targetType: group.target_type,
                          targetId: group.target_id,
                          targetLabel: group.target_label,
                        })
                      }
                      className="cursor-pointer rounded-full bg-accent px-3 py-1 text-[13px] font-medium text-on-accent"
                    >
                      {viewer.role === "super_admin"
                        ? group.target_type === "user"
                          ? t("admin.suspendOwner")
                          : t("admin.removeTarget")
                        : group.target_type === "user"
                          ? t("admin.proposeSuspension")
                          : t("admin.proposeRemoval")}
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ModerationForm
        role={viewer.role}
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onDone={done}
      />
    </div>
  );
}
