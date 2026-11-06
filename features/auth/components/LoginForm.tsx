"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { login } from "../api";
import { DEMO_ACCOUNT } from "../mock";
import { validateLogin, type FieldErrors } from "../validation";
import { AuthField } from "./AuthField";
import { AuthShell } from "./AuthShell";
import { GoogleButton } from "./GoogleButton";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = () => {
    setUsername(DEMO_ACCOUNT.username);
    setPassword(DEMO_ACCOUNT.password);
    setErrors({});
    setFormError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const fieldErrors = validateLogin({ username, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await login({ username, password });
      router.replace(next);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-medium text-ink underline underline-offset-2"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AuthField
          id="username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="russel"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-badge/30 bg-badge/10 px-3 py-2 text-sm text-badge"
          >
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full cursor-pointer rounded-lg bg-accent text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <button
          type="button"
          onClick={fillDemo}
          className="cursor-pointer text-center text-sm text-muted underline underline-offset-2 transition-colors hover:text-ink"
        >
          Use the demo account
        </button>
      </form>
      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        or continue with
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <GoogleButton next={next} disabled={submitting} />
    </AuthShell>
  );
}
