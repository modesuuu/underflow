"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * Backend-down error state for the collab detail page (audit P2-9).
 * Rendered instead of notFound() when the detail fetch fails with
 * network_error — a genuine 404 (unknown id) still shows notFound.
 * Follows the app's "Something went wrong" card pattern
 * (MyCollabBoardLoader / ProfileLoader); Retry reloads the page,
 * the same recovery the route error boundary's "Try again" offers.
 */
export function CollabDetailError() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
      <Icon name="error-circle" size={40} className="text-placeholder" />
      <p className="text-lg font-medium text-ink">
        Couldn&apos;t load this project
      </p>
      <p className="max-w-xs text-sm text-muted">
        The server couldn&apos;t be reached. Check your connection and try
        again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="pressable mt-1 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Retry
      </button>
    </div>
  );
}
