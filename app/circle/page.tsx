import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getCircleProjects } from "@/features/circle/api";
import { CircleIndexList } from "@/features/circle/components/CircleIndexList";

export const metadata: Metadata = { title: "Circles — Underflow" };

export default async function CircleIndexPage() {
  const projects = await getCircleProjects();
  return (
    <AppShell breadcrumbRoot="Dashboard" breadcrumbLeaf="Circle">
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-6 lg:mx-0 lg:ml-[28px] lg:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-tight text-ink">
            Circles
          </h1>
          <p className="text-sm text-muted">
            One circle per project you are part of.
          </p>
        </div>
        <CircleIndexList projects={projects} />
      </div>
    </AppShell>
  );
}
