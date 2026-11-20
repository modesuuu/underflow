"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/features/admin/components/AdminShell";
import {
  decideActionRequest,
  fmtDateTime,
  getActionRequests,
} from "@/features/admin/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { ActionRequestRow } from "@/features/admin/types";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pill,
} from "@/features/admin/components/ui";

/**
 * Admin Approvals (spec-admin.md §4.2 + §7): the action-request
 * queue. Super Admins decide — approve executes the action on
 * the spot, reject requires a note. Monitors see their own
 * requests and how each one ended.
 */

const ACTION_LABEL: Record<string, DictKey> = {
  remove_post: "admin.reqRemovePost",
  remove_comment: "admin.reqRemoveComment",
  remove_collab: "admin.reqRemoveCollab",
  suspend_user: "admin.reqSuspend",
  dismiss_report: "admin.reqDismiss",
};

function RequestMeta({ row }: { row: ActionRequestRow }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {ACTION_LABEL[row.action_type] ? t(ACTION_LABEL[row.action_type]) : row.action_type}
        </span>
        {row.with_strike ? <Pill tone="danger">{t("admin.strike")}</Pill> : null}
        <span className="text-[13px] text-muted">
          {t("admin.byWhen", { name: row.requester_name, date: fmtDateTime(row.created_at) })}
        </span>
      </div>
      <p className="line-clamp-2 text-sm">{row.target_label}</p>
      <p className="text-sm text-muted">
        {t("admin.reasonWord")} <span className="text-ink">{row.reason}</span>
      </p>
    </div>
  );
}

function PendingRow({
  row,
  isSuper,
  onDecided,
}: {
  row: ActionRequestRow;
  isSuper: boolean;
  onDecided: () => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approved" | "rejected") {
    if (busy) return;
    setBusy(true);
    try {
      await decideActionRequest(row.id, decision, note.trim() || undefined);
      toast.success(
        decision === "approved"
          ? t("admin.approvedToast")
          : t("admin.rejectedToast")
      );
      onDecided();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.couldNotDecide")
      );
      setBusy(false);
      setMode("idle");
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-4">
      <RequestMeta row={row} />
      {isSuper ? (
        <div className="mt-3.5 border-t border-line pt-3.5">
          {mode === "idle" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("approve")}
                className="cursor-pointer rounded-full bg-accent px-3.5 py-1 text-[13px] font-medium text-on-accent"
              >
                {t("admin.approve")}
              </button>
              <button
                type="button"
                onClick={() => setMode("reject")}
                className="cursor-pointer rounded-full border border-line px-3.5 py-1 text-[13px] font-medium"
              >
                {t("admin.reject")}
              </button>
            </div>
          )}
          {mode === "approve" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted">
                {t("admin.approveNote")}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide("approved")}
                className="cursor-pointer rounded-full bg-accent px-3.5 py-1 text-[13px] font-medium text-on-accent disabled:opacity-40"
              >
                {busy ? t("admin.executing") : t("admin.confirmExecution")}
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="cursor-pointer text-[13px] text-muted"
              >
                {t("common.back")}
              </button>
            </div>
          )}
          {mode === "reject" && (
            <div className="flex flex-col gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                autoFocus
                placeholder={t("admin.rejectPlaceholder")}
                className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || note.trim() === ""}
                  onClick={() => decide("rejected")}
                  className="cursor-pointer rounded-full px-3.5 py-1 text-[13px] font-medium text-white disabled:opacity-40"
                  style={{ background: "var(--color-error, #c9303a)" }}
                >
                  {busy ? t("common.saving") : t("admin.rejectRequest")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="cursor-pointer text-[13px] text-muted"
                >
                  {t("common.back")}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3.5 border-t border-line pt-3.5 text-[13px] text-muted">
          {t("admin.waitingSuper")}
        </p>
      )}
    </div>
  );
}

export default function AdminApprovalsPage() {
  const { t } = useLanguage();
  const { viewer, refreshOverview } = useAdmin();
  const [rows, setRows] = useState<ActionRequestRow[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setError(false);
    getActionRequests()
      .then(setRows)
      .catch(() => setError(true));
  }, [attempt]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    setAttempt((n) => n + 1);
    refreshOverview();
  };

  const pending = (rows ?? []).filter((r) => r.status === "pending");
  const history = (rows ?? []).filter((r) => r.status !== "pending");

  return (
    <div>
      <PageHeader
        title={t("admin.approvalsTitle")}
        subtitle={
          viewer.role === "super_admin"
            ? t("admin.approvalsSubtitleSuper")
            : t("admin.approvalsSubtitleMonitor")
        }
      />

      {error ? (
        <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
      ) : rows === null ? (
        <p className="text-sm text-muted">{t("admin.loadingApprovals")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2.5 text-sm font-semibold tracking-tight">
              {t("admin.waitingDecision")}
            </h2>
            {pending.length === 0 ? (
              <EmptyState>{t("admin.noPendingRequests")}</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((row) => (
                  <PendingRow
                    key={row.id}
                    row={row}
                    isSuper={viewer.role === "super_admin"}
                    onDecided={reload}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2.5 text-sm font-semibold tracking-tight">
              {t("admin.decisionHistory")}
            </h2>
            {history.length === 0 ? (
              <EmptyState>{t("admin.noDecisions")}</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-line bg-surface px-5 py-4"
                  >
                    <RequestMeta row={row} />
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-line pt-3.5 text-[13px] text-muted">
                      {row.status === "approved" ? (
                        <Pill tone="success">{t("admin.approvedPill")}</Pill>
                      ) : (
                        <Pill tone="danger">{t("admin.rejectedPill")}</Pill>
                      )}
                      <span>
                        {t("admin.byWhen", {
                          name: row.decider_name ?? t("admin.aSuperAdmin"),
                          date: fmtDateTime(row.decided_at),
                        })}
                      </span>
                      {row.decision_note && (
                        <span className="text-ink">
                          {t("admin.noteLine", { note: row.decision_note })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
