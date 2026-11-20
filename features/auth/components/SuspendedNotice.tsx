"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { ApiError } from "@/lib/api-client";
import { createSuspendedAppeal } from "@/features/appeals/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { SuspendedAppealInfo, SuspendedInfo } from "../api";

/**
 * The suspension screen (spec-admin.md §4.4): shown instead of a
 * session when login is refused for a suspended account. Carries the
 * reason and the one allowed action — a single appeal, filed with
 * the credentials that were just used to try to log in.
 */
export function SuspendedNotice({
  info,
  username,
  password,
  googleIdToken,
  onAppealSent,
}: {
  info: SuspendedInfo;
  username?: string;
  password?: string;
  googleIdToken?: string;
  onAppealSent: (appeal: SuspendedAppealInfo) => void;
}) {
  const { t, lang } = useLanguage();
  const [message, setMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const appeal = info.appeal;
  // Reached via a mid-session kick: no just-typed credential exists,
  // so the appeal needs the password re-entered to verify the filer.
  const needsCredential = !password && !googleIdToken && appeal === null;

  const suspendedDate = info.suspendedAt
    ? new Date(info.suspendedAt.replace(" ", "T")).toLocaleDateString(
        lang === "id" ? "id-ID" : "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : null;

  const submit = async () => {
    if (busy || message.trim().length < 3) return;
    setBusy(true);
    try {
      const args = {
        username,
        idToken: googleIdToken,
        message: message.trim(),
      } as Parameters<typeof createSuspendedAppeal>[0];
      const credential = password || confirmPassword || undefined;
      if (credential) args.password = credential;
      const created = await createSuspendedAppeal(args);
      toast.success(t("auth.appealSent"));
      onAppealSent({
        status: created.status,
        decisionNote: created.decision_note,
        createdAt: created.created_at,
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : t("auth.couldNotSendAppeal"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg bg-bg px-4 py-3">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {t("auth.reason")}
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap">
          {info.reason || t("auth.noReason")}
        </p>
        {suspendedDate ? (
          <p className="mt-2 text-xs text-muted">
            {t("auth.suspendedOn", { date: suspendedDate })}
          </p>
        ) : null}
      </div>

      {appeal === null ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">{t("auth.appealTitle")}</p>
            <p className="mt-0.5 text-sm text-muted">
              {t("auth.appealSubtitle")}
            </p>
          </div>
          {needsCredential ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="suspended-confirm-password"
                className="text-sm font-medium"
              >
                {t("auth.yourPassword")}
              </label>
              <input
                id="suspended-confirm-password"
                type="password"
                autoComplete="current-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth.appealPasswordPlaceholder")}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-subtle focus:border-accent"
              />
            </div>
          ) : null}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={t("auth.appealMessagePlaceholder")}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-subtle focus:border-accent"
          />
          <Button
            type="button"
            label={busy ? t("auth.sending") : t("auth.sendAppeal")}
            variant="primary"
            size="lg"
            width="100%"
            isLoading={busy}
            isDisabled={
              busy ||
              message.trim().length < 3 ||
              (needsCredential && confirmPassword.length === 0)
            }
            onClick={submit}
          />
        </div>
      ) : appeal.status === "pending" ? (
        <p className="rounded-lg bg-bg px-4 py-3 text-sm text-muted">
          {t("auth.appealPending")}
        </p>
      ) : appeal.status === "denied" ? (
        <div className="rounded-lg bg-bg px-4 py-3">
          <p className="text-sm font-medium">{t("auth.appealDenied")}</p>
          {appeal.decisionNote ? (
            <p className="mt-1 text-sm text-muted">
              {t("auth.decisionNote", { note: appeal.decisionNote })}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted">
            {t("auth.remainsSuspended")}
          </p>
        </div>
      ) : (
        <p className="rounded-lg bg-bg px-4 py-3 text-sm text-muted">
          {t("auth.appealAccepted")}
        </p>
      )}
    </div>
  );
}
