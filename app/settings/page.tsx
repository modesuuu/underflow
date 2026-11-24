import { AppShell } from "@/components/layout/AppShell";
import { SettingsIndex } from "@/features/settings/components/SettingsIndex";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};


export default function SettingsRoutePage() {
  return (
    <AppShell breadcrumbRoot="Account" breadcrumbLeaf="Settings">
      <SettingsIndex />
    </AppShell>
  );
}
