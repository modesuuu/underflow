"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/features/admin/components/AdminShell";
import {
  decideActionRequest,
  fmtDateTime,
  getActionRequests,
} from "@/features/admin/api";
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

const ACTION_LABEL: Record<string, string> = {
  remove_post: "Remove post",
  remove_comment: "Remove comment",
  remove_collab: "Remove collaboration",
  suspend_user: "Suspend account",
  dismiss_report: "Dismiss report",
};

function RequestMeta({ row }: { row: ActionRequestRow }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {ACTION_LABEL[row.action_type] ?? row.action_type}
        </span>
        {row.with_strike ? <Pill tone="danger">Strike</Pill> : null}
        <span className="text-[13px] text-muted">
          by {row.requester_name} · {fmtDateTime(row.created_at)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm">{row.target_label}</p>
      <p className="mt-1 text-sm text-muted">
        Reason: <span className="text-ink">{row.reason}</span>
      </p>
    </>
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
          ? "Approved and executed."
          : "Request rejected."
      );
      onDecided();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save the decision."
      );
      setBusy(false);
      setMode("idle");
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <RequestMeta row={row} />
      {isSuper ? (
        <div className="mt-3 border-t border-line pt-3">
          {mode === "idle" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("approve")}
                className="cursor-pointer rounded-full bg-accent px-3.5 py-1 text-[13px] font-medium text-on-accent"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setMode("reject")}
                className="cursor-pointer rounded-full border border-line px-3.5 py-1 text-[13px] font-medium"
              >
                Reject
              </button>
            </div>
          )}
          {mode === "approve" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted">
                Approving runs the action immediately.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide("approved")}
                className="cursor-pointer rounded-full bg-accent px-3.5 py-1 text-[13px] font-medium text-on-accent disabled:opacity-40"
              >
                {busy ? "Executing..." : "Confirm execution"}
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="cursor-pointer text-[13px] text-muted"
              >
                Back
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
                placeholder="Why is this rejected? The requester will see this note."
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
                  {busy ? "Saving..." : "Reject request"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="cursor-pointer text-[13px] text-muted"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 border-t border-line pt-3 text-[13px] text-muted">
          Waiting for a Super Admin to decide.
        </p>
      )}
    </div>
  );
}

export default function AdminApprovalsPage() {
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
        title="Approvals"
        subtitle={
          viewer.role === "super_admin"
            ? "Action proposals from Monitors. Approving executes the action right away."
            : "Your action proposals and their outcomes. Only a Super Admin can execute them."
        }
      />

      {error ? (
        <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
      ) : rows === null ? (
        <p className="text-sm text-muted">Loading approvals...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2.5 text-sm font-semibold tracking-tight">
              Waiting for a decision
            </h2>
            {pending.length === 0 ? (
              <EmptyState>No pending requests.</EmptyState>
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
              Decision history
            </h2>
            {history.length === 0 ? (
              <EmptyState>No decisions yet.</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-line bg-surface px-4 py-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <RequestMeta row={row} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5 text-[13px] text-muted">
                      {row.status === "approved" ? (
                        <Pill tone="success">Approved</Pill>
                      ) : (
                        <Pill tone="danger">Rejected</Pill>
                      )}
                      <span>
                        by {row.decider_name ?? "a Super Admin"} ·{" "}
                        {fmtDateTime(row.decided_at)}
                      </span>
                      {row.decision_note && (
                        <span className="text-ink">
                          Note: {row.decision_note}
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
