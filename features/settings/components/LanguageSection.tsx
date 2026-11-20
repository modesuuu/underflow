"use client";

import { Icon } from "@/components/ui/Icon";
import { useLanguage, type Lang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { SettingsSection } from "./SettingsSection";

const OPTIONS: { id: Lang; labelKey: DictKey }[] = [
  { id: "en", labelKey: "settings.language.en" },
  { id: "id", labelKey: "settings.language.id" },
];

/**
 * Language section: the interface language for this device
 * (English / Bahasa Indonesia), persisted in localStorage and
 * applied immediately through the language context. Surfaces
 * still being translated say so in the note under the choices.
 */
export function LanguageSection() {
  const { lang, setLang, t } = useLanguage();

  return (
    <SettingsSection
      title={t("settings.language.title")}
      description={t("settings.language.description")}
    >
      <div className="flex flex-col">
        {OPTIONS.map((option, i) => {
          const active = lang === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setLang(option.id)}
              aria-pressed={active}
              className={
                "pressable flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left " +
                (i > 0 ? "border-t border-line" : "")
              }
            >
              <span className="text-sm font-medium text-ink">
                {t(option.labelKey)}
              </span>
              {active && (
                <span className="text-accent">
                  <Icon name="check" size={20} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-muted">{t("settings.language.note")}</p>
    </SettingsSection>
  );
}
