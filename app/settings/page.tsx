import { AppShell } from "@/components/layout/AppShell";
import { SettingsPage } from "@/features/settings/components/SettingsPage";

export default function SettingsRoutePage() {
  return (
    <AppShell breadcrumbRoot="Account" breadcrumbLeaf="Settings">
      <SettingsPage />
    </AppShell>
  );
}
