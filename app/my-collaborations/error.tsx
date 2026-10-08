"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary for /my-collaborations (covers the nested
 * category + detail routes — one boundary, not one per route).
 */
export default function MyCollaborationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("My Collaborations route error:", error);
  }, [error]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-2xl font-bold text-ink">Something went wrong</p>
      <p className="max-w-sm text-sm text-muted">
        We couldn&apos;t load your collaborations. This is usually a temporary
        glitch — give it another try.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="pressable cursor-pointer rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
