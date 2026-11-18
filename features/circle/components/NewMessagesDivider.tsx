"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The NEW divider in a zone timeline, styled after the day
 * dividers: a centered label between two hairlines, in the accent
 * colour, carrying how many messages were unread when the reader
 * opened the zone (the frozen snapshot count). Purely
 * presentational; the timeline decides where it sits.
 */
export function NewMessagesDivider({ count }: { count: number }) {
  const { t } = useLanguage();
  const label =
    count === 1
      ? t("circle.newMessageOne")
      : t("circle.newMessagesMany", { count });
  return (
    <div
      className="flex items-center gap-3 px-4 pt-3 pb-2"
      role="separator"
      aria-label={label}
    >
      <span className="h-px flex-1 bg-accent/50" />
      <span className="text-xs font-bold tracking-wide text-accent">
        {label}
      </span>
      <span className="h-px flex-1 bg-accent/50" />
    </div>
  );
}
