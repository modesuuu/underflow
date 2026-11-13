"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { login, SuspendedAccountError, type SuspendedInfo } from "../api";
import { firstError, validateLogin, type FieldErrors } from "../validation";
import { Button } from "@astryxdesign/core/Button";
import { AuthField } from "./AuthField";
import { AuthShell } from "./AuthShell";
import { GoogleButton } from "./GoogleButton";
import { SuspendedNotice } from "./SuspendedNotice";

export function LoginForm() {
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


  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const fieldErrors = validateLogin({ username, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      // Inline errors pinpoint the field; the toast is the clear
      // notification the user asked for (first problem, spelled out).
      toast.error(firstError(fieldErrors) ?? "Check the form and try again.");
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
        title="Account suspended"
        subtitle="Your account was suspended by the moderation team"
        footer={
          <button
            type="button"
            onClick={() => setSuspended(null)}
            className="font-medium text-ink underline underline-offset-2"
          >
            Back to log in
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
          placeholder="Username"
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
        <Button
          type="submit"
          label={submitting ? "Logging in…" : "Log in"}
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
