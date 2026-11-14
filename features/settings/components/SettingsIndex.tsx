"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface SettingsCategory {
  href: string;
  icon: string;
  labelKey: DictKey;
  descKey: DictKey;
}

const CATEGORIES: SettingsCategory[] = [
  {
    href: "/settings/profile",
    icon: "user",
    labelKey: "settings.profile.label",
    descKey: "settings.profile.desc",
  },
  {
    href: "/settings/appearance",
    icon: "palette",
    labelKey: "settings.appearance.label",
    descKey: "settings.appearance.desc",
  },
  {
    href: "/settings/language",
    icon: "globe",
    labelKey: "settings.language.label",
    descKey: "settings.language.desc",
  },
  {
    href: "/settings/help",
    icon: "help-circle",
    labelKey: "settings.help.label",
    descKey: "settings.help.desc",
  },
  {
    href: "/settings/account",
    icon: "lock-alt",
    labelKey: "settings.account.label",
    descKey: "settings.account.desc",
  },
];

/**
 * The Settings home: one row per category, hub-and-spoke (the
 * user's structure call, 2026-11-13). Each category owns a
 * sub-page, so Settings can grow a category at a time — password
 * and notification preferences are already queued behind
 * backend work — instead of one page scrolling forever.
 */
export function SettingsIndex() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-[40px] leading-none font-semibold tracking-tight text-ink uppercase">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-muted">
          {t("settings.subtitle")}
        </p>
      </header>
      <div className="flex flex-col">
        {CATEGORIES.map((cat, i) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={
              "flex items-center gap-3 py-4 " +
              (i > 0 ? "border-t border-line" : "")
            }
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-ink">
              <Icon name={cat.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium text-ink">{t(cat.labelKey)}</span>
              <span className="truncate text-sm text-muted">
                {t(cat.descKey)}
              </span>
            </span>
            <span className="text-muted">
              <Icon name="chevron-right" size={20} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
