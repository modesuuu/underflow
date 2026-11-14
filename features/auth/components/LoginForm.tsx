"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, SUSPENDED_NOTICE_KEY } from "@/lib/api-client";
import {
  login,
  mapSuspendedInfo,
  SuspendedAccountError,
  type SuspendedInfo,
} from "../api";
import { firstError, validateLogin, type FieldErrors } from "../validation";
import { Button } from "@astryxdesign/core/Button";
import { AuthField } from "./AuthField";
import { AuthShell } from "./AuthShell";
import { GoogleButton } from "./GoogleButton";
import { SuspendedNotice } from "./SuspendedNotice";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

export function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [suspended, setSuspended] = useState<{
    info: SuspendedInfo;
    username: string;
    password: string;
    googleIdToken?: string;
  } | null>(null);

  // A mid-session suspension (see api-client) lands here with the
  // notice payload stashed: show the suspension screen directly.
  // The username is known but no password — the notice asks for the
  // password again before an appeal can be filed.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SUSPENDED_NOTICE_KEY);
      if (!raw) return;
      window.localStorage.removeItem(SUSPENDED_NOTICE_KEY);
      const parsed = JSON.parse(raw) as {
        payload?: unknown;
        username?: string;
      };
      const info = mapSuspendedInfo(parsed.payload);
      if (info) {
        setSuspended({ info, username: parsed.username ?? "", password: "" });
      }
    } catch {
      // A malformed stash must never break the login screen.
    }
  }, []);


  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const fieldErrors = validateLogin({ username, password });
    const localizedErrors: FieldErrors = {};
    for (const [field, key] of Object.entries(fieldErrors)) {
      localizedErrors[field] = t(key as DictKey);
    }
    setErrors(localizedErrors);
    if (Object.keys(fieldErrors).length > 0) {
      // Inline errors pinpoint the field; the toast is the clear
      // notification the user asked for (first problem, spelled out).
      toast.error(firstError(localizedErrors) ?? t("auth.checkForm"));
      return;
    }
    setSubmitting(true);
    try {
      await login({ username, password });
      router.replace(next);
    } catch (err) {
      if (err instanceof SuspendedAccountError) {
        // Suspended accounts get their own screen (reason + appeal),
        // not a toast (spec §4.4).
        setSuspended({ info: err.suspended, username, password });
        return;
      }
      if (err instanceof ApiError && err.code === "rate_limited") {
        toast.error(t("auth.errTooMany"));
        return;
      }
      // Credential failures arrive pre-genericized from the api
      // layer ("Username/password salah"); anything else that is
      // not an ApiError is a network failure.
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Can't reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (suspended) {
    return (
      <AuthShell
        title={t("auth.accountSuspended")}
        subtitle={t("auth.suspendedSubtitle")}
        footer={
          <button
            type="button"
            onClick={() => setSuspended(null)}
            className="font-medium text-ink underline underline-offset-2"
          >
            {t("auth.backToLogin")}
          </button>
        }
      >
        <SuspendedNotice
          info={suspended.info}
          username={suspended.username || undefined}
          password={suspended.password || undefined}
          googleIdToken={suspended.googleIdToken}
          onAppealSent={(appeal) =>
            setSuspended((prev) =>
              prev ? { ...prev, info: { ...prev.info, appeal } } : prev,
            )
          }
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.dontHaveAccount")}{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-medium text-ink underline underline-offset-2"
          >
            {t("auth.signUp")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AuthField
          id="username"
          label={t("auth.username")}
          type="text"
          autoComplete="username"
          placeholder={t("auth.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
        />
        <AuthField
          id="password"
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          placeholder={t("auth.yourPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-ink underline underline-offset-2"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <Button
          type="submit"
          label={submitting ? t("auth.loggingIn") : t("auth.logIn")}
          variant="primary"
          size="lg"
          width="100%"
          isLoading={submitting}
          isDisabled={submitting}
        />
      </form>
      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        {t("auth.orContinueWith")}
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <GoogleButton
        next={next}
        disabled={submitting}
        onSuspended={(info, idToken) =>
          setSuspended({ info, username: "", password: "", googleIdToken: idToken })
        }
      />
    </AuthShell>
  );
}
