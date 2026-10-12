import Link from "next/link";

/**
 * Root-level 404 (one for the whole app, not per route — unknown
 * /collaborations/:id lands here too, so the "back to collaborations" link
 * stays useful).
 */
export default function NotFound() {
  return (
    <div className="pad-ruled flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-figures text-sm font-medium tracking-[0.08em] text-margin">404</p>
      <h1 className="text-4xl font-bold tracking-[-0.02em] text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        This page doesn&apos;t exist — it may have been moved, or the link is
        broken.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/collaborations"
          className="pressable rounded-sm bg-ink px-4 py-2.5 text-sm font-semibold text-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Back to Collaborations
        </Link>
        <Link
          href="/"
          className="px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
