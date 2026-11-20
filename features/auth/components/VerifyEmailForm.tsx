"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "../api";
import { Button } from "@astryxdesign/core/Button";
import { AuthShell } from "./AuthShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type State = "working" | "success" | "invalid";

/**
 * Verify-email landing (pending scheme, 2026-11-16): exchanges the
 * ?token= from the signup email for a real account. The endpoint
 * answers with a full login payload (the click is the identity
 * proof), so success stores the session and lands the user on the
 * feed; an invalid or expired link sends them back to sign up
 * again (re-registering with the same details refreshes the
 * pending registration and resends the link).
 */
export function VerifyEmailForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("working");
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
        setState("success");
        window.setTimeout(() => router.replace("/"), 900);
      } catch {
        setState("invalid");
      }
    })();
  }, [token, router]);

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
        <p className="text-sm text-muted">{t("verify.redirecting")}</p>
      </AuthShell>
    );
  }

  if (state === "invalid") {
    return (
      <AuthShell
        title={t("verify.invalidTitle")}
        subtitle={t("verify.invalidBody")}
        footer={footer}
      >
        <Button
          label={t("auth.signUp")}
          variant="primary"
          size="lg"
          width="100%"
          onClick={() => router.replace("/signup")}
        />
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
