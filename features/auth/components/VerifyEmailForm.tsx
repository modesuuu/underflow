"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { resendVerification, verifyEmail } from "../api";
import { getSession, setSession } from "../session";
import { Button } from "@astryxdesign/core/Button";
import { AuthShell } from "./AuthShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type State = "working" | "success" | "invalid";

/**
 * Verify-email landing: exchanges the ?token= from the verification
 * email for the verified flag. On success it also updates the local
 * session (when the link is opened in a signed-in browser) so the
 * reminder banner disappears immediately.
 */
export function VerifyEmailForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("working");
  const [sending, setSending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        await verifyEmail(token);
        const sess = getSession();
        if (sess && !sess.user.emailVerified) {
          setSession({
            ...sess,
            user: { ...sess.user, emailVerified: true },
          });
        }
        setState("success");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await resendVerification();
      toast.success(t("verify.sent"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(t("auth.errTooMany"));
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error(t("auth.errNetwork"));
      }
    } finally {
      setSending(false);
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

  if (state === "success") {
    return (
      <AuthShell
        title={t("verify.successTitle")}
        subtitle={t("verify.successBody")}
        footer={footer}
      >
        <Button
          label={t("verify.goHome")}
          variant="primary"
          size="lg"
          width="100%"
          onClick={() => router.replace("/")}
        />
      </AuthShell>
    );
  }

  if (state === "invalid") {
    const sess = getSession();
    const canResend = !!sess && !sess.user.emailVerified;
    return (
      <AuthShell
        title={t("verify.invalidTitle")}
        subtitle={t("verify.invalidBody")}
        footer={footer}
      >
        {canResend ? (
          <Button
            label={t("verify.resend")}
            variant="primary"
            size="lg"
            width="100%"
            isLoading={sending}
            isDisabled={sending}
            onClick={resend}
          />
        ) : (
          <Button
            label={t("verify.goHome")}
            variant="primary"
            size="lg"
            width="100%"
            onClick={() => router.replace("/")}
          />
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("verify.title")}
      subtitle={t("verify.checking")}
      footer={footer}
    >
      <p className="text-sm text-muted">{t("verify.checking")}</p>
    </AuthShell>
  );
}
