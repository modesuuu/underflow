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

export function SignupForm() {
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
      toast.error(firstError(fieldErrors) ?? "Check the form and try again.");
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
            : "Can't reach the server. Check your connection and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Underflow to find your team"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-ink underline underline-offset-2"
          >
            Log in
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
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          hint="3–20 lowercase letters, numbers, dots, underscores, or dashes."
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@university.ac.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button
          type="submit"
          label={submitting ? "Creating your account…" : "Create account"}
          variant="primary"
          size="lg"
          width="100%"
          isLoading={submitting}
          isDisabled={submitting}
        />
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
