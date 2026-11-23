import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { MyTasksPage } from "@/features/planner/components/MyTasksPage";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Everything assigned to you, across all your project planners.",
};

/**
 * Halaman Tasks global (Fase 1): agregasi personal lintas planner
 * collab — statistik, panel Next up, dan list per hari. Datanya
 * client-side (butuh token sesi), jadi halaman ini cuma shell.
 */
export default function TasksPage() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Tasks"
      panel={<NotificationsPanel className="px-6" />}
    >
      <div className="page-enter px-4 py-6 sm:px-6 sm:py-8">
        <MyTasksPage />
      </div>
    </AppShell>
  );
}
