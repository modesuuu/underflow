import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { LanguageSection } from "@/features/settings/components/LanguageSection";

export default function SettingsLanguagePage() {
  return (
    <AppShell
      breadcrumbRoot="Settings"
      breadcrumbLeaf="Language"
      backLabel="Settings"
      backHref="/settings"
    >
      <h1 className="sr-only">Language settings</h1>
      <SettingsDetail>
        <LanguageSection />
      </SettingsDetail>
    </AppShell>
  );
}
