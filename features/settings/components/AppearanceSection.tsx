"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SettingsSection } from "./SettingsSection";

/**
 * Appearance section: the same theme control the sidebar footer
 * carries (Light / System / Dark, persisted per device in
 * localStorage), presented as a settings row. One mechanism, two
 * homes — changing it here updates the sidebar control and the
 * whole app immediately.
 */
export function AppearanceSection() {
  const { t } = useLanguage();
  return (
    <SettingsSection
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-ink">{t("settings.appearance.theme")}</span>
        <ThemeToggle variant="full" />
      </div>
    </SettingsSection>
  );
}
