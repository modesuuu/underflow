"use client";

/**
 * Shared load-failure panel for the My Collaborations client
 * loaders (board, category, detail). The fetch behind them is
 * user-scoped and can fail (backend down, session expired), so
 * the panel explains it briefly and offers a retry that
 * re-runs the loader's fetch instead of a dead end.
 */
export function MyCollabLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-line bg-surface p-6">
      <p className="text-base font-semibold text-ink">Something went wrong</p>
      <p className="text-sm text-muted">
        We couldn&apos;t load your collaborations. This is usually a
        temporary glitch — give it another try.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="pressable mt-2 cursor-pointer rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Try again
      </button>
    </div>
  );
}
