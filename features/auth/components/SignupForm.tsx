"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { register } from "../api";
import { firstError, validateRegister, type FieldErrors } from "../validation";
import { Button } from "@astryxdesign/core/Button";
import { AuthField } from "./AuthField";
import { AuthShell } from "./AuthShell";
import { GoogleButton } from "./GoogleButton";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function SignupForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const fieldErrors = validateRegister({ username, email, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      toast.error(firstError(fieldErrors) ?? t("auth.checkForm"));
      return;
    }
    setSubmitting(true);
    try {
      await register({ username, email, password });
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError && err.code === "username_taken") {
        // Taken username/email: inline on the field AND a toast,
        // so the reason is impossible to miss.
        setErrors((prev) => ({ ...prev, username: err.message }));
        toast.error(err.message);
      } else if (err instanceof ApiError && err.code === "email_taken") {
        setErrors((prev) => ({ ...prev, email: err.message }));
        toast.error(err.message);
      } else {
        toast.error(
          err instanceof ApiError
            ? err.message
            : t("auth.serverUnreachable"),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.createTitle")}
      subtitle={t("auth.createSubtitle")}
      footer={
        <>
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-ink underline underline-offset-2"
          >
            {t("auth.logIn")}
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
          hint={t("auth.usernameHint")}
        />
        <AuthField
          id="email"
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          placeholder="you@university.ac.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <AuthField
          id="password"
          label={t("auth.password")}
          type="password"
          autoComplete="new-password"
          placeholder={t("auth.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button
          type="submit"
          label={submitting ? t("auth.creatingAccount") : t("auth.createAccount")}
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
      <GoogleButton next={next} disabled={submitting} />
    </AuthShell>
  );
}
