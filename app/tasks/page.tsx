import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PlannerBoardPage } from "@/features/planner/components/PlannerBoardPage";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Weekly planner board for your project tasks.",
};

/**
 * Halaman Tasks: canvas planner mingguan mengikuti desain FigCraft
 * (board per anggota × hari). Sengaja TANPA panel notifikasi di
 * kanan (keputusan user 2026-11-24) supaya board-nya full width.
 * Datanya client-side (butuh token sesi), jadi halaman ini cuma shell.
 */
export default function TasksPage() {
  return (
    <AppShell breadcrumbRoot="Dashboard" breadcrumbLeaf="Tasks">
      <div className="page-enter px-4 py-6 sm:px-6 sm:py-8">
        <PlannerBoardPage />
      </div>
    </AppShell>
  );
}
