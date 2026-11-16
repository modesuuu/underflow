"use client";

import { useAdmin } from "@/features/admin/components/AdminShell";
import { PageHeader, Pill } from "@/features/admin/components/ui";
import { fmtDateTime } from "@/features/admin/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

/**
 * Admin Overview (spec-admin.md §7): headline numbers from the
 * real tables plus the latest moderation activity. The overview
 * payload arrives through AdminShell's gate fetch — no refetch.
 */

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warning" | "danger";
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <p
        className="text-2xl font-semibold tracking-tight"
        style={
          tone === "danger" && value > 0
            ? { color: "var(--color-error, #c9303a)" }
            : tone === "warning" && value > 0
              ? { color: "var(--uf-ink)" }
              : undefined
        }
      >
        {value}
      </p>
      <p className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
        {label}
        {tone === "danger" && value > 0 && <Pill tone="danger">{t("admin.needsReview")}</Pill>}
        {tone === "warning" && value > 0 && <Pill tone="warning">{t("admin.waiting")}</Pill>}
      </p>
    </div>
  );
}

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

function TrendRow({
  label,
  days,
  pick,
  barClass,
}: {
  label: string;
  days: { date: string; registrations: number; posts: number; collabs: number }[];
  pick: (d: { registrations: number; posts: number; collabs: number }) => number;
  barClass: string;
}) {
  const values = days.map(pick);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-32 shrink-0 text-[13px] text-muted">{label}</span>
      <div className="flex h-12 flex-1 items-end gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            title={d.date + ": " + pick(d)}
            className={"min-w-0 flex-1 rounded-sm " + barClass}
            style={{ height: Math.max(6, Math.round((pick(d) / max) * 100)) + "%" }}
          />
        ))}
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium">{total}</span>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const { overview } = useAdmin();

  return (
    <div>
      <PageHeader
        title={t("admin.overviewTitle")}
        subtitle={t("admin.overviewSubtitle")}
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label={t("admin.kpiTotalUsers")} value={overview.users_total} />
        <Kpi label={t("admin.kpiNewUsers")} value={overview.users_new_7d} />
        <Kpi label={t("admin.kpiActiveCollabs")} value={overview.collabs_active} />
        <Kpi label={t("admin.kpiNewPosts")} value={overview.posts_new_7d} />
        <Kpi label={t("admin.kpiOpenReports")} value={overview.reports_open} tone="danger" />
        <Kpi
          label={t("admin.kpiRequestsWaiting")}
          value={overview.action_requests_pending}
          tone="warning"
        />
        <Kpi label={t("admin.kpiAppealsWaiting")} value={overview.appeals_pending} tone="warning" />
        <Kpi label={t("admin.kpiSuspended")} value={overview.users_suspended} />
      </div>

      <h2 className="mt-8 mb-3 text-[15px] font-semibold">{t("admin.trendsTitle")}</h2>
      <div className="rounded-lg border border-line bg-surface px-4 py-2">
        <TrendRow
          label={t("admin.trendRegistrations")}
          days={overview.trends ?? []}
          pick={(d) => d.registrations}
          barClass="bg-accent"
        />
        <TrendRow
          label={t("admin.trendPosts")}
          days={overview.trends ?? []}
          pick={(d) => d.posts}
          barClass="bg-ink"
        />
        <TrendRow
          label={t("admin.trendCollabs")}
          days={overview.trends ?? []}
          pick={(d) => d.collabs}
          barClass="bg-accent opacity-40"
        />
        <div className="flex justify-between pb-1 pl-36 pr-14 text-[11px] text-subtle">
          <span>{overview.trends?.[0]?.date ?? ""}</span>
          <span>{overview.trends?.[overview.trends.length - 1]?.date ?? ""}</span>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-[15px] font-semibold">{t("admin.recentActivity")}</h2>
      {overview.recent_activity.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          {t("admin.noActivity")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {overview.recent_activity.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span>
                  <span className="font-medium">{a.actor_name}</span>{" "}
                  {ACTION_LABEL[a.action_type] ? t(ACTION_LABEL[a.action_type]) : a.action_type}
                  {a.owner_name && (
                    <>
                      {" "}· target: <span className="font-medium">{a.owner_name}</span>
                    </>
                  )}
                </span>
                {a.reason && (
                  <span className="truncate text-[13px] text-muted">{a.reason}</span>
                )}
              </div>
              {Number(a.strike) === 1 && <Pill tone="danger">{t("admin.strike")}</Pill>}
              <span className="shrink-0 text-[13px] text-subtle">
                {fmtDateTime(a.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
