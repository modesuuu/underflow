"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { useAdmin } from "@/features/admin/components/AdminShell";
import {
  decideAppeal,
  fmtDateTime,
  getAdminAppeals,
} from "@/features/admin/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { AdminAppealRow } from "@/features/admin/types";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pill,
} from "@/features/admin/components/ui";

/**
 * Admin Appeals (spec-admin.md §4.5 + §7): the appeal queue.
 * Granting reverses the original action through the executor
 * (content restored / account reactivated, strike voided); denying
 * requires a decision note the appellant will read. Monitors can
 * view the queue; only Super Admins decide.
 */

const ACTION_LABEL: Record<string, DictKey> = {
  remove_post: "admin.reqRemovePost",
  remove_comment: "admin.reqRemoveComment",
  remove_collab: "admin.reqRemoveCollab",
  suspend_user: "admin.reqSuspend",
};

function AppealMeta({ row }: { row: AdminAppealRow }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[15px] font-semibold">{row.appellant_name}</span>
        {row.appellant_strikes > 0 ? (
          <Pill tone="danger">
            {row.appellant_strikes > 1
              ? t("admin.strikesActiveMany", { count: row.appellant_strikes })
              : t("admin.strikesActiveOne", { count: row.appellant_strikes })}
          </Pill>
        ) : null}
        <span className="text-[13px] text-muted">
          {row.appellant_history === 1
            ? t("admin.actionsOnRecordOne", { count: row.appellant_history })
            : t("admin.actionsOnRecordMany", { count: row.appellant_history })}
        </span>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-muted">{t("admin.appealsWhat")}</dt>
          <dd className="min-w-0">
            <span className="font-medium">
              {ACTION_LABEL[row.action.action_type] ? t(ACTION_LABEL[row.action.action_type]) : row.action.action_type}
            </span>
            {row.action.label ? (
              <span className="text-muted"> · “{row.action.label}”</span>
            ) : null}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-muted">{t("admin.originalReason")}</dt>
          <dd className="min-w-0">{row.action.reason}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-muted">{t("admin.filed")}</dt>
          <dd className="text-muted">{fmtDateTime(row.created_at)}</dd>
        </div>
      </dl>

      <div>
        <p className="text-[13px] font-medium text-muted">{t("admin.appealMessage")}</p>
        <p className="mt-1.5 rounded-lg bg-bg px-3.5 py-2.5 text-sm whitespace-pre-wrap">
          {row.message}
        </p>
      </div>
    </div>
  );
}

function PendingRow({
  row,
  isSuper,
  onDecided,
}: {
  row: AdminAppealRow;
  isSuper: boolean;
  onDecided: () => void;
}) {
  const { t } = useLanguage();
  const [confirmGrant, setConfirmGrant] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const decide = async (decision: "granted" | "denied") => {
    if (busy) return;
    setBusy(true);
    try {
      await decideAppeal(
        row.id,
        decision,
        decision === "denied" ? note.trim() : note.trim() || undefined,
      );
      toast.success(
        decision === "granted"
          ? t("admin.grantedToast")
          : t("admin.deniedToast"),
      );
      onDecided();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("admin.couldNotDecide"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <AppealMeta row={row} />
      {isSuper ? (
        <div className="mt-4 border-t border-line pt-4">
          {confirmGrant ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">
                {t("admin.grantConfirmText")}
              </span>
              <button
                type="button"
                onClick={() => decide("granted")}
                disabled={busy}
                className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-on-accent disabled:opacity-50"
              >
                {busy ? t("common.saving") : t("admin.confirmGrant")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmGrant(false)}
                className="px-2 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : denyOpen ? (
            <div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={t("admin.denyPlaceholder")}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle focus:border-accent"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide("denied")}
                  disabled={busy || note.trim().length < 3}
                  className="rounded-full bg-[#c9303a] px-3.5 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  {busy ? t("common.saving") : t("admin.denyAppeal")}
                </button>
                <button
                  type="button"
                  onClick={() => setDenyOpen(false)}
                  className="px-2 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmGrant(true)}
                className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-on-accent"
              >
                {t("admin.grantAppeal")}
              </button>
              <button
                type="button"
                onClick={() => setDenyOpen(true)}
                className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:text-ink"
              >
                {t("admin.denyAppeal")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
          {t("admin.waitingSuper")}
        </p>
      )}
    </div>
  );
}

export default function AdminAppealsPage() {
  const { t } = useLanguage();
  const { viewer, refreshOverview } = useAdmin();
  const isSuper = viewer?.role === "super_admin";
  const [rows, setRows] = useState<AdminAppealRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setAttempt((a) => a + 1);
    refreshOverview();
  }, [refreshOverview]);

  useEffect(() => {
    let live = true;
    getAdminAppeals()
      .then((data) => {
        if (!live) return;
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        if (!live) return;
        setError(
          err instanceof ApiError ? err.message : t("admin.couldNotLoadAppeals"),
        );
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  const pending = rows?.filter((r) => r.status === "pending") ?? [];
  const history = rows?.filter((r) => r.status !== "pending") ?? [];

  return (
    <div>
      <PageHeader
        title={t("admin.appealsTitle")}
        subtitle={t("admin.appealsSubtitle")}
      />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : rows === null ? (
        <p className="py-10 text-sm text-muted">{t("admin.loadingAppeals")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-tight">
              {t("admin.pendingCount", { count: pending.length })}
            </h2>
            {pending.length === 0 ? (
              <EmptyState>{t("admin.noAppealsWaiting")}</EmptyState>
            ) : (
              pending.map((row) => (
                <PendingRow
                  key={row.id}
                  row={row}
                  isSuper={isSuper}
                  onDecided={reload}
                />
              ))
            )}
          </section>
          {history.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold tracking-tight">{t("admin.historyTitle")}</h2>
              {history.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-line bg-surface px-5 py-4"
                >
                  <AppealMeta row={row} />
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5 text-[13px] text-muted">
                    {row.status === "granted" ? (
                      <Pill tone="success">{t("admin.grantedPill")}</Pill>
                    ) : (
                      <Pill tone="danger">{t("admin.deniedPill")}</Pill>
                    )}
                    <span>
                      {t("admin.decidedLine", { date: row.decided_at ? fmtDateTime(row.decided_at) : "" })}
                    </span>
                    {row.decision_note ? (
                      <span className="text-ink">
                        {t("admin.noteLine", { note: row.decision_note })}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
