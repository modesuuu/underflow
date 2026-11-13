import type { ReactNode } from "react";

/**
 * Shared body wrapper for the Settings sub-pages: the Astryx
 * gray ground and page padding, full width and left-aligned
 * like the other app pages (the user's call — no centered
 * narrow column).
 */
export function SettingsDetail({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col gap-4 collab-ground px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
      {children}
    </div>
  );
}
