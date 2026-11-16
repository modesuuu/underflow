import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ApplicationsPage } from "@/features/applications/components/ApplicationsPage";

export const metadata: Metadata = {
  title: "Applications",
  description:
    "Applications to your projects and the ones you sent, in one place.",
};

/**
 * Central Applications page (audit P1 #12). Previously an owner
 * with many applicants had to open every inbox thread one by one.
 */
export default function Page() {
  return (
    <AppShell breadcrumbRoot="Tools" breadcrumbLeaf="Applications">
      <ApplicationsPage />
    </AppShell>
  );
}
