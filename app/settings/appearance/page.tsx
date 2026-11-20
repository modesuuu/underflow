import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { AppearanceSection } from "@/features/settings/components/AppearanceSection";

export default function SettingsAppearancePage() {
  return (
    <AppShell
      breadcrumbRoot="Settings"
      breadcrumbLeaf="Appearance"
      backLabel="Settings"
      backHref="/settings"
    >
      <h1 className="sr-only">Appearance settings</h1>
      <SettingsDetail>
        <AppearanceSection />
      </SettingsDetail>
    </AppShell>
  );
}
