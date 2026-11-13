"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { ApiError } from "@/lib/api-client";
import { createSuspendedAppeal } from "@/features/appeals/api";
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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const appeal = info.appeal;

  const suspendedDate = info.suspendedAt
    ? new Date(info.suspendedAt.replace(" ", "T")).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : null;

  const submit = async () => {
    if (busy || message.trim().length < 3) return;
    setBusy(true);
    try {
      const created = await createSuspendedAppeal({
        username,
        password,
        idToken: googleIdToken,
        message: message.trim(),
      });
      toast.success("Appeal sent. The moderation team will review it.");
      onAppealSent({
        status: created.status,
        decisionNote: created.decision_note,
        createdAt: created.created_at,
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not send your appeal. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg bg-bg px-4 py-3">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          Reason
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap">
          {info.reason || "No reason was provided."}
        </p>
        {suspendedDate ? (
          <p className="mt-2 text-xs text-muted">
            Suspended on {suspendedDate}
          </p>
        ) : null}
      </div>

      {appeal === null ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">Appeal this suspension</p>
            <p className="mt-0.5 text-sm text-muted">
              Think this was a mistake? Tell the moderation team why. You
              can appeal once.
            </p>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Explain your situation"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-subtle focus:border-accent"
          />
          <Button
            type="button"
            label={busy ? "Sending…" : "Send appeal"}
            variant="primary"
            size="lg"
            width="100%"
            isLoading={busy}
            isDisabled={busy || message.trim().length < 3}
            onClick={submit}
          />
        </div>
      ) : appeal.status === "pending" ? (
        <p className="rounded-lg bg-bg px-4 py-3 text-sm text-muted">
          Your appeal is being reviewed by the moderation team. If it is
          accepted, your account will be reactivated and you can log in
          again.
        </p>
      ) : appeal.status === "denied" ? (
        <div className="rounded-lg bg-bg px-4 py-3">
          <p className="text-sm font-medium">Your appeal was denied.</p>
          {appeal.decisionNote ? (
            <p className="mt-1 text-sm text-muted">
              Decision note: {appeal.decisionNote}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted">
            Your account remains suspended.
          </p>
        </div>
      ) : (
        <p className="rounded-lg bg-bg px-4 py-3 text-sm text-muted">
          Your appeal was accepted. Try logging in again.
        </p>
      )}
    </div>
  );
}
