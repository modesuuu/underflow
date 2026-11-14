"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotPassword } from "../api";
import { validateEmailField } from "../validation";
import { Button } from "@astryxdesign/core/Button";
import { AuthField } from "./AuthField";
import { AuthShell } from "./AuthShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

/**
 * Forgot-password form: asks for the account email and ALWAYS lands
 * on the same "check your email" state, whether or not the address
 * is registered — the backend answers generically for the same
 * reason (no account enumeration). Resend simply re-enters the form.
 */
export function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const key = validateEmailField(email);
    setError(key ? t(key as DictKey) : undefined);
    if (key) {
      toast.error(t(key as DictKey));
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      toast.error(t("auth.errNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <Link
      href="/login"
      className="font-medium text-ink underline underline-offset-2"
    >
      {t("auth.backToLogin")}
    </Link>
  );

  if (sent) {
    return (
      <AuthShell
        title={t("auth.forgotSentTitle")}
        subtitle={t("auth.forgotSentBody")}
        footer={footer}
      >
        <div className="flex flex-col items-start gap-5">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-sm font-medium text-ink underline underline-offset-2"
          >
            {t("auth.forgotResend")}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={footer}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AuthField
          id="email"
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <Button
          type="submit"
          label={submitting ? t("auth.forgotSending") : t("auth.forgotSubmit")}
          variant="primary"
          size="lg"
          width="100%"
          isLoading={submitting}
          isDisabled={submitting}
        />
      </form>
    </AuthShell>
  );
}
