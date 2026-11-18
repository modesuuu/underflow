"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The Discord-style NEW divider in a zone timeline: a red tag and
 * hairline marking where the messages the reader had not seen yet
 * begin. Purely presentational; the timeline decides where it sits
 * (from the read-state snapshot taken when the zone was opened).
 */
export function NewMessagesDivider() {
  const { t } = useLanguage();
  return (
    <div
      className="flex items-center gap-3 px-4 pt-3 pb-1"
      role="separator"
      aria-label={t("circle.newDivider")}
    >
      <span className="rounded-sm bg-error px-1.5 py-px text-[10px] font-bold tracking-wide text-white">
        {t("circle.newDivider")}
      </span>
      <span className="h-px flex-1 bg-error/60" />
    </div>
  );
}
