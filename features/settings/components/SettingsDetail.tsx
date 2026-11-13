import type { ReactNode } from "react";

/**
 * Shared body wrapper for the Settings sub-pages: the Astryx
 * gray ground and the same centered 680px column the Settings
 * home uses, so moving between the index and a category detail
 * never shifts the layout.
 */
export function SettingsDetail({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col collab-ground px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
