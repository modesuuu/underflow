"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { dismissReport, postActionRequest, postAdminAction } from "../api";
import type { AdminRole, ModerationTarget } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

/**
 * The shared moderation form (spec-admin.md §7): one form, two
 * meanings. A Super Admin's submit executes immediately; a
 * Monitor's submit becomes an action request that only runs
 * after Super Admin approval. The backend enforces the split —
 * these labels just make it legible.
 */

const TITLES: Record<string, { super: DictKey; monitor: DictKey; verb: string }> = {
  remove_post: { super: "admin.formRemovePostSuper", monitor: "admin.formRemovePostMonitor", verb: "Remove" },
  remove_comment: { super: "admin.formRemoveCommentSuper", monitor: "admin.formRemoveCommentMonitor", verb: "Remove" },
  remove_collab: { super: "admin.formRemoveCollabSuper", monitor: "admin.formRemoveCollabMonitor", verb: "Remove" },
  suspend_user: { super: "admin.formSuspendSuper", monitor: "admin.formSuspendMonitor", verb: "Suspend" },
  unsuspend_user: { super: "admin.formUnsuspendSuper", monitor: "admin.formUnsuspendSuper", verb: "Unsuspend" },
  restore_content: { super: "admin.formRestoreSuper", monitor: "admin.formRestoreSuper", verb: "Restore" },
  dismiss_report: { super: "admin.formDismissSuper", monitor: "admin.formDismissMonitor", verb: "Dismiss" },
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
  const { t } = useLanguage();
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
  const title = t(isSuper ? meta.super : meta.monitor);
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
        onDone(t("admin.formDone", { action: t(meta.super) }));
      } else {
        await postActionRequest({
          action_type: target.actionType,
          target_id: target.targetId,
          reason: reason.trim(),
          with_strike: canStrike ? withStrike : undefined,
        });
        onDone(t("admin.proposalSent"));
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("admin.somethingWrong")
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
            aria-label={t("common.close")}
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
            {t("admin.monitorNote")}
          </p>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            {t("admin.reasonField")}{needsReason ? "" : t("admin.optionalSuffix")}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder={
              target.actionType === "dismiss_report"
                ? t("admin.dismissReasonPlaceholder")
                : t("admin.actionReasonPlaceholder")
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
              {t("admin.strikeLabel")}
              <span className="block text-[13px] text-muted">
                {t("admin.strikeHint")}
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
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reasonOk || submitting}
            className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent disabled:cursor-default disabled:opacity-40"
          >
            {submitting
              ? t("admin.working")
              : isSuper
                ? t(meta.super)
                : t("admin.submitProposal")}
          </button>
        </div>
      </div>
    </div>
  );
}
