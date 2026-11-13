"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { dismissReport, postActionRequest, postAdminAction } from "../api";
import type { AdminRole, ModerationTarget } from "../types";

/**
 * The shared moderation form (spec-admin.md §7): one form, two
 * meanings. A Super Admin's submit executes immediately; a
 * Monitor's submit becomes an action request that only runs
 * after Super Admin approval. The backend enforces the split —
 * these labels just make it legible.
 */

const TITLES: Record<string, { super: string; monitor: string; verb: string }> = {
  remove_post: { super: "Remove post", monitor: "Propose post removal", verb: "Remove" },
  remove_comment: { super: "Remove comment", monitor: "Propose comment removal", verb: "Remove" },
  remove_collab: { super: "Remove collaboration", monitor: "Propose collaboration removal", verb: "Remove" },
  suspend_user: { super: "Suspend account", monitor: "Propose account suspension", verb: "Suspend" },
  unsuspend_user: { super: "Unsuspend account", monitor: "", verb: "Unsuspend" },
  restore_content: { super: "Restore content", monitor: "", verb: "Restore" },
  dismiss_report: { super: "Dismiss report", monitor: "Propose report dismissal", verb: "Dismiss" },
};

const NEEDS_REASON = new Set([
  "remove_post",
  "remove_comment",
  "remove_collab",
  "suspend_user",
  "dismiss_report",
]);
const CAN_STRIKE = new Set(["remove_post", "remove_comment", "remove_collab"]);

export function ModerationForm({
  role,
  target,
  onClose,
  onDone,
}: {
  role: AdminRole;
  target: ModerationTarget | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [withStrike, setWithStrike] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setReason("");
      setWithStrike(true);
      setError(null);
      setSubmitting(false);
    }
  }, [target]);

  if (!target) return null;
  const meta = TITLES[target.actionType] ?? TITLES.remove_post;
  const isSuper = role === "super_admin";
  const needsReason = NEEDS_REASON.has(target.actionType);
  const canStrike = CAN_STRIKE.has(target.actionType);
  const title = isSuper ? meta.super : meta.monitor;
  const reasonOk = !needsReason || reason.trim().length >= 3;

  async function submit() {
    if (!target || !reasonOk || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isSuper) {
        if (target.actionType === "dismiss_report") {
          await dismissReport(target.targetId, reason.trim());
        } else {
          await postAdminAction({
            action_type: target.actionType,
            target_type: target.targetType,
            target_id: target.targetId,
            reason: reason.trim(),
            with_strike: canStrike ? withStrike : undefined,
          });
        }
        onDone(`${meta.super} done.`);
      } else {
        await postActionRequest({
          action_type: target.actionType,
          target_id: target.targetId,
          reason: reason.trim(),
          with_strike: canStrike ? withStrike : undefined,
        });
        onDone("Proposal sent. A Super Admin will review it.");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full rounded-lg p-5 shadow-xl"
        style={{ maxWidth: 480, backgroundColor: "var(--uf-surface)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-muted hover:text-ink"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-bg px-3 py-2.5 text-sm">
          <span className="line-clamp-2">{target.targetLabel}</span>
        </div>

        {!isSuper && (
          <p className="mt-3 text-[13px] text-muted">
            Monitors cannot execute actions directly. This proposal
            runs only after a Super Admin approves it.
          </p>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Reason{needsReason ? "" : " (optional)"}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder={
              target.actionType === "dismiss_report"
                ? "Why is this report not a violation?"
                : "Why is this action being taken?"
            }
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle focus:border-accent"
          />
        </label>

        {canStrike && (
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={withStrike}
              onChange={(e) => setWithStrike(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[#35702b]"
            />
            <span>
              Count as a strike for the owner
              <span className="block text-[13px] text-muted">
                Leave on for violations. Turn off for administrative
                removals, such as duplicates.
              </span>
            </span>
          </label>
        )}

        {error && (
          <p
            className="mt-3 rounded-lg px-3 py-2 text-sm"
            style={{
              background:
                "color-mix(in srgb, var(--color-error, #c9303a) 10%, transparent)",
              color: "var(--color-error, #c9303a)",
            }}
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reasonOk || submitting}
            className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent disabled:cursor-default disabled:opacity-40"
          >
            {submitting
              ? "Working..."
              : isSuper
                ? meta.super
                : "Submit proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
