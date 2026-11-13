"use client";

import { useAdmin } from "@/features/admin/components/AdminShell";
import { PageHeader, Pill } from "@/features/admin/components/ui";
import { fmtDateTime } from "@/features/admin/api";

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
        {tone === "danger" && value > 0 && <Pill tone="danger">Needs review</Pill>}
        {tone === "warning" && value > 0 && <Pill tone="warning">Waiting</Pill>}
      </p>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  remove_post: "Removed a post",
  remove_comment: "Removed a comment",
  remove_collab: "Removed a collaboration",
  suspend_user: "Suspended a user",
  dismiss_report: "Dismissed a report",
  restore_content: "Restored content",
  unsuspend_user: "Unsuspended a user",
  grant_appeal: "Granted an appeal",
  deny_appeal: "Denied an appeal",
};

export default function AdminOverviewPage() {
  const { overview } = useAdmin();

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="What is happening on Underflow right now."
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Total users" value={overview.users_total} />
        <Kpi label="New users (7 days)" value={overview.users_new_7d} />
        <Kpi label="Active collaborations" value={overview.collabs_active} />
        <Kpi label="New posts (7 days)" value={overview.posts_new_7d} />
        <Kpi label="Open reports" value={overview.reports_open} tone="danger" />
        <Kpi
          label="Action requests waiting"
          value={overview.action_requests_pending}
          tone="warning"
        />
        <Kpi label="Appeals waiting" value={overview.appeals_pending} tone="warning" />
        <Kpi label="Suspended users" value={overview.users_suspended} />
      </div>

      <h2 className="mt-8 mb-3 text-[15px] font-semibold">Recent moderation activity</h2>
      {overview.recent_activity.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No moderation actions yet. When admins remove content or
          suspend accounts, the trail shows up here.
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
                  {ACTION_LABEL[a.action_type] ?? a.action_type}
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
              {Number(a.strike) === 1 && <Pill tone="danger">Strike</Pill>}
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
