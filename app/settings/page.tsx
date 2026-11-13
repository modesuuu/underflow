import { AppShell } from "@/components/layout/AppShell";
import { SettingsIndex } from "@/features/settings/components/SettingsIndex";

export default function SettingsRoutePage() {
  return (
    <AppShell breadcrumbRoot="Account" breadcrumbLeaf="Settings">
      <SettingsIndex />
    </AppShell>
  );
}
