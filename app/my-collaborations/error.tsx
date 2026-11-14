"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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
  const { t } = useLanguage();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("My Collaborations route error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-2xl font-bold text-ink">{t("misc.somethingWrong")}</p>
      <p className="max-w-sm text-sm text-muted">
        {t("misc.myCollabErrorBody")}
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
