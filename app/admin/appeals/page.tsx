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

const ACTION_LABEL: Record<string, string> = {
  remove_post: "Remove post",
  remove_comment: "Remove comment",
  remove_collab: "Remove collaboration",
  suspend_user: "Suspend account",
};

function AppealMeta({ row }: { row: AdminAppealRow }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{row.appellant_name}</span>
        {row.appellant_strikes > 0 ? (
          <Pill tone="danger">
            {row.appellant_strikes} active strike
            {row.appellant_strikes > 1 ? "s" : ""}
          </Pill>
        ) : null}
        <span className="text-[13px] text-muted">
          {row.appellant_history} moderation action
          {row.appellant_history === 1 ? "" : "s"} on record ·{" "}
          {fmtDateTime(row.created_at)}
        </span>
      </div>
      <p className="mt-1 text-sm">
        Appeals:{" "}
        <span className="font-medium">
          {ACTION_LABEL[row.action.action_type] ?? row.action.action_type}
        </span>
        {row.action.label ? (
          <span className="text-muted"> · “{row.action.label}”</span>
        ) : null}
      </p>
      <p className="mt-1 text-sm text-muted">
        Original reason: <span className="text-ink">{row.action.reason}</span>
      </p>
      <p className="mt-2 rounded-lg bg-bg px-3 py-2 text-sm whitespace-pre-wrap">
        {row.message}
      </p>
    </>
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
          ? "Appeal granted. The original action has been reversed."
          : "Appeal denied.",
      );
      onDecided();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not save the decision.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <AppealMeta row={row} />
      {isSuper ? (
        <div className="mt-3 border-t border-line pt-3">
          {confirmGrant ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">
                Granting restores the content or reactivates the account
                right away.
              </span>
              <button
                type="button"
                onClick={() => decide("granted")}
                disabled={busy}
                className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-on-accent disabled:opacity-50"
              >
                {busy ? "Saving…" : "Confirm grant"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmGrant(false)}
                className="px-2 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </div>
          ) : denyOpen ? (
            <div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Decision note (required, the appellant will read this)"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle focus:border-accent"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide("denied")}
                  disabled={busy || note.trim().length < 3}
                  className="rounded-full bg-[#c9303a] px-3.5 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Deny appeal"}
                </button>
                <button
                  type="button"
                  onClick={() => setDenyOpen(false)}
                  className="px-2 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                >
                  Cancel
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
                Grant appeal
              </button>
              <button
                type="button"
                onClick={() => setDenyOpen(true)}
                className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:text-ink"
              >
                Deny appeal
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          Waiting for a Super Admin to decide.
        </p>
      )}
    </div>
  );
}

export default function AdminAppealsPage() {
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
          err instanceof ApiError ? err.message : "Could not load appeals.",
        );
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  const pending = rows?.filter((r) => r.status === "pending") ?? [];
  const history = rows?.filter((r) => r.status !== "pending") ?? [];

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 py-6">
      <PageHeader
        title="Appeals"
        subtitle="Users asking for a moderation action to be reversed. Granting restores the content or reactivates the account."
      />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : rows === null ? (
        <p className="py-10 text-sm text-muted">Loading appeals…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-tight">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <EmptyState>No appeals are waiting for a decision.</EmptyState>
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
              <h2 className="text-sm font-semibold tracking-tight">History</h2>
              {history.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {row.status === "granted" ? (
                      <Pill tone="success">Granted</Pill>
                    ) : (
                      <Pill tone="danger">Denied</Pill>
                    )}
                    <span className="text-[13px] text-muted">
                      decided {row.decided_at ? fmtDateTime(row.decided_at) : ""}
                    </span>
                  </div>
                  <div className="mt-2">
                    <AppealMeta row={row} />
                  </div>
                  {row.decision_note ? (
                    <p className="mt-2 text-sm text-muted">
                      Decision note:{" "}
                      <span className="text-ink">{row.decision_note}</span>
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
