import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings",
};


export default function SettingsProfilePage() {
  return (
    <AppShell
      breadcrumbRoot="Settings"
      breadcrumbLeaf="Profile"
      backLabel="Settings"
      backHref="/settings"
    >
      <h1 className="sr-only">Profile settings</h1>
      <SettingsDetail>
        <ProfileSection />
      </SettingsDetail>
    </AppShell>
  );
}
