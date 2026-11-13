import type { ReactNode } from "react";

/**
 * Shared body wrapper for the Settings sub-pages: page
 * padding, full width and left-aligned like the other app
 * pages, on the shell's plain white ground (no card shell,
 * no gray ground — the user's call).
 */
export function SettingsDetail({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
      {children}
    </div>
  );
}
