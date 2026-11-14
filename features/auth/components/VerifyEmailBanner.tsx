"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { resendVerification } from "@/features/auth/api";
import { useSessionUser } from "@/features/auth/store";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const DISMISS_KEY = "uf-verify-dismissed";

/**
 * Soft email-verification reminder (2026-11-14): a slim accent bar
 * above the app for signed-in users whose email is not verified yet.
 * The account works normally — this only nudges. Resend goes through
 * the real endpoint (3/hour server-side); the bar can be dismissed
 * for the rest of the browser session and disappears for good once
 * the session learns the verified flag (verify page / backfill).
 */
export function VerifyEmailBanner() {
  const { t } = useLanguage();
  const user = useSessionUser();
  const [dismissed, setDismissed] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!user || !user.email || user.emailVerified !== false || dismissed) {
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

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Session storage unavailable: the state above still hides it.
    }
  };

  return (
    <div className="flex items-center gap-3 bg-accent px-4 py-2 text-on-accent">
      <Icon name="envelope" size={16} className="shrink-0" />
      <p className="min-w-0 flex-1 truncate text-[13px]">
        <span className="font-semibold">{t("verify.bannerTitle")}</span>
        {" — "}
        {t("verify.bannerBody", { email: user.email })}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="shrink-0 text-[13px] font-semibold underline underline-offset-2 disabled:opacity-60"
      >
        {t("verify.resend")}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("common.close")}
        className="shrink-0"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
