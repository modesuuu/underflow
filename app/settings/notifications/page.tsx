import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { NotificationsSection } from "@/features/settings/components/NotificationsSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification Settings",
};


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
