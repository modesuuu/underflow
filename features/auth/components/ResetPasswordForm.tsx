"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { resetPassword } from "../api";
import { MIN_PASSWORD_LENGTH } from "../validation";
import { Button } from "@astryxdesign/core/Button";
import { AuthField } from "./AuthField";
import { AuthShell } from "./AuthShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Reset-password form: exchanges the ?token= from the email link for
 * a new password. A rejected token (expired, used, unknown) lands on
 * the invalid-link state with a path back to /forgot-password.
 * A successful reset revokes every older session server-side, so the
 * only way forward is a fresh login.
 */
export function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(token === "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors: { password?: string; confirm?: string } = {};
    if (!password) nextErrors.password = t("auth.errPasswordRequired");
    else if (password.length < MIN_PASSWORD_LENGTH)
      nextErrors.password = t("auth.errPasswordLength");
    if (confirm !== password) nextErrors.confirm = t("auth.errPasswordMismatch");
    setErrors(nextErrors);
    const first = nextErrors.password ?? nextErrors.confirm;
    if (first) {
      toast.error(first);
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success(t("auth.resetSuccess"));
      router.replace("/login");
    } catch (err) {
      if (err instanceof ApiError) setInvalid(true);
      else toast.error(t("auth.errNetwork"));
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

  if (invalid) {
    return (
      <AuthShell
        title={t("auth.resetInvalidTitle")}
        subtitle={t("auth.resetInvalidBody")}
        footer={footer}
      >
        <Button
          label={t("auth.requestNewLink")}
          variant="primary"
          size="lg"
          width="100%"
          onClick={() => router.push("/forgot-password")}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      footer={footer}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AuthField
          id="new-password"
          label={t("auth.newPassword")}
          type="password"
          autoComplete="new-password"
          placeholder={t("auth.newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <AuthField
          id="confirm-password"
          label={t("auth.confirmPassword")}
          type="password"
          autoComplete="new-password"
          placeholder={t("auth.confirmPassword")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button
          type="submit"
          label={t("auth.resetSubmit")}
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
