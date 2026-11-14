"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Root-level 404 (one for the whole app, not per route — unknown
 * /collaborations/:id lands here too, so the "back to collaborations" link
 * stays useful).
 */
export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-dvh min-w-0 flex-1 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="text-4xl font-bold text-ink">{t("misc.pageNotFound")}</h1>
      <p className="max-w-sm text-sm text-muted">
        {t("misc.notFoundBody")}
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/collaborations"
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {t("misc.backToCollaborations")}
        </Link>
        <Link
          href="/"
          className="px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {t("misc.goHome")}
        </Link>
      </div>
    </div>
  );
}
