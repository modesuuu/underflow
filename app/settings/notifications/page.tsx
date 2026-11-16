import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { NotificationsSection } from "@/features/settings/components/NotificationsSection";

export default function SettingsNotificationsPage() {
  return (
    <AppShell
      breadcrumbRoot="Settings"
      breadcrumbLeaf="Notifications"
      backLabel="Settings"
      backHref="/settings"
    >
      <h1 className="sr-only">Notification settings</h1>
      <SettingsDetail>
        <NotificationsSection />
      </SettingsDetail>
    </AppShell>
  );
}
