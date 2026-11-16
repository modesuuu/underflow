"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Shared route-level states (audit P2 #22). Segments that do
 * not need a bespoke skeleton use RouteLoading from their
 * loading.tsx; error.tsx files render RouteErrorState, which
 * mirrors the established collaborations/my-collaborations
 * error design so every route fails the same way.
 */
export function RouteLoading() {
  const { t } = useLanguage();
  return (
    <div
      className="flex min-h-dvh min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-bg"
      role="status"
      aria-label={t("common.loading")}
    >
      <LogoMark className="h-10 w-10 animate-pulse text-ink" />
      <p className="text-sm text-muted">{t("common.loading")}</p>
    </div>
  );
}

export function RouteErrorState({
  error,
  reset,
  scope,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  scope: string;
}) {
  const { t } = useLanguage();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(scope + " route error:", error);
  }, [error, scope]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-2xl font-bold text-ink">{t("misc.pageFailed")}</p>
      <p className="max-w-sm text-sm text-muted">{t("misc.reloadBody")}</p>
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
