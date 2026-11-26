import { AppShell } from "@/components/layout/AppShell";
import { SettingsDetail } from "@/features/settings/components/SettingsDetail";
import { AccountSection } from "@/features/settings/components/AccountSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
};


export default function SettingsAccountPage() {
  return (
    <AppShell
      breadcrumbRoot="Settings"
      breadcrumbLeaf="Account"
      backLabel="Settings"
      backHref="/settings"
    >
      <h1 className="sr-only">Account settings</h1>
      <SettingsDetail>
        <AccountSection />
      </SettingsDetail>
    </AppShell>
  );
}
