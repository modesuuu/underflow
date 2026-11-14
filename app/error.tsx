"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Root error boundary — catches crashes below `app/layout.tsx` that no
 * nested boundary owns: `/` and `/dashboard/[postId]` (P1-B #13). The
 * collaborations routes have their own boundary at app/collaborations/error.tsx
 * and do NOT fall through to this one.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Root route error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-2xl font-bold text-ink">{t("misc.pageFailed")}</p>
      <p className="max-w-sm text-sm text-muted">
        {t("misc.reloadBody")}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="pressable cursor-pointer rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {t("misc.tryAgain")}
        </button>
        <Link
          href="/"
          className="rounded-md px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {t("misc.goHome")}
        </Link>
      </div>
    </div>
  );
}
