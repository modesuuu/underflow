"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { createAppeal, type MyAppeal } from "../api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Appeal affordance under a moderation notice in the system thread
 * (spec-admin.md §4.4): one appeal per action. Without an appeal it
 * is a button + inline form; once filed it becomes a status line,
 * and the decision itself also arrives as its own system message.
 */
export function AppealControl({
  actionId,
  appeal,
  onSubmitted,
}: {
  actionId: string;
  appeal?: MyAppeal;
  onSubmitted: (appeal: MyAppeal) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (appeal) {
    return (
      <p className="rounded-full border border-line px-3 py-1 text-xs text-muted">
        {appeal.status === "pending"
          ? t("appeal.statusPending")
          : appeal.status === "granted"
            ? t("appeal.statusGranted")
            : t("appeal.statusDenied")}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        {t("appeal.button")}
      </button>
    );
  }

  const submit = async () => {
    if (busy || message.trim().length < 3) return;
    setBusy(true);
    try {
      const created = await createAppeal(actionId, message.trim());
      toast.success(t("auth.appealSent"));
      onSubmitted(created);
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
    <div className="w-full max-w-[85%] sm:max-w-[310px]">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder={t("appeal.placeholder")}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle focus:border-accent"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || message.trim().length < 3}
          className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-on-accent disabled:opacity-50"
        >
          {busy ? t("auth.sending") : t("auth.sendAppeal")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
