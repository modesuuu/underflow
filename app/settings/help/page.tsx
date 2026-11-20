import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { HelpSection } from "@/features/settings/components/HelpSection";

export default function SettingsHelpPage() {
  return (
    <AppShell
      breadcrumbRoot="Settings"
      breadcrumbLeaf="Help Center"
      backLabel="Settings"
      backHref="/settings"
    >
      <h1 className="sr-only">Help Center</h1>
      <SettingsDetail>
        <HelpSection />
      </SettingsDetail>
    </AppShell>
  );
}
