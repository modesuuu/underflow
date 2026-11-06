"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "../api";

/** The Google "G" mark (official four-color mark, drawn as SVG). */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303C33.654,32.657,29.223,36,24,36c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.002,0.003-0.003l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

/**
 * Continue with Google. Facebook is deliberately absent (user decision
 * 2026-11-06: Google only). The mock signs in as the Google-linked demo
 * account; see signInWithGoogle for the backend TODO.
 */
export function GoogleButton({ next, disabled }: { next: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.replace(next);
    } catch {
      setError("Google sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={busy || disabled}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleMark className="size-5 shrink-0" />
        {busy ? "Signing in…" : "Continue with Google"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-badge">
          {error}
        </p>
      )}
    </div>
  );
}
