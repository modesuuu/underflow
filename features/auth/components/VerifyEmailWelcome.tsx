"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { resendVerification } from "@/features/auth/api";
import { useSessionUser } from "@/features/auth/store";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export const VERIFY_WELCOME_KEY = "uf-verify-welcome";

/**
 * One-time post-signup notice (2026-11-16): right after creating an
 * account, a modal says plainly that a verification link is on its
 * way to the new user's inbox. The slim banner alone was too easy to
 * miss — a new user could land in the app without ever realising an
 * email step existed. Soft mode still applies: "Start exploring"
 * enters the app unverified and the banner keeps nudging afterwards.
 * The flag is set by SignupForm and cleared when the modal closes.
 */
export function VerifyEmailWelcome() {
  const { t } = useLanguage();
  const user = useSessionUser();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(VERIFY_WELCOME_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      // Storage unavailable: the banner still reminds them.
    }
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.sessionStorage.removeItem(VERIFY_WELCOME_KEY);
    } catch {
      // Nothing to clear.
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!open || !user || !user.email || user.emailVerified !== false) {
    return null;
  }

  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await resendVerification();
      toast.success(t("verify.sent"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(t("auth.errTooMany"));
      } else {
        toast.error(t("auth.errNetwork"));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("verify.welcomeTitle")}
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[380px] flex-col gap-4 rounded-lg bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Icon name="envelope" size={24} className="shrink-0 text-accent" />
          <h3 className="text-lg font-bold text-ink">
            {t("verify.welcomeTitle")}
          </h3>
        </div>
        <p className="text-sm text-muted">
          {t("verify.welcomeBody", { email: user.email })}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="cursor-pointer rounded-md bg-bg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-line/50 disabled:opacity-60"
          >
            {t("verify.resend")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={close}
            className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-85"
          >
            {t("verify.welcomeContinue")}
          </button>
        </div>
      </div>
    </div>
  );
}
