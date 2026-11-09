import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MyCollabBoard } from "@/features/my-collaborations/components/MyCollabBoard";

export const metadata: Metadata = {
  title: "My Collaborations",
  description:
    "Track the projects you've joined or applied to, grouped by your progress.",
};

/**
 * Fallback = the body of app/my-collaborations/loading.tsx minus its
 * AppShell (the band, the attention card, the toolbar, and the
 * sections), which renders here while getMyCollabProjects()
 * suspends.
 */
function MyCollabBoardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Schedule bar */}
      <div className="h-12 w-full rounded-full border border-line bg-surface" />

      {/* Header: title + New Project, stats right */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-80 max-w-full rounded-lg bg-placeholder" />
          <div className="h-9 w-32 rounded-full bg-placeholder" />
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-8 w-12 rounded bg-placeholder" />
              <div className="h-3 w-20 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      </div>

      {/* Attention */}
      <div className="flex flex-col gap-3">
        <div className="h-8 w-44 rounded-full bg-placeholder" />
        <div className="h-[84px] rounded-2xl border border-line bg-surface" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-[76px] rounded-2xl border border-line bg-surface" />
          <div className="h-[76px] rounded-2xl border border-line bg-surface" />
        </div>
      </div>

      {/* Projects: label + filter row + card grid */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-8 w-40 rounded-full bg-placeholder" />
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <div className="h-9 w-44 rounded-full border border-line bg-surface" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-full border border-line bg-surface" />
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[216px] rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function MyCollabBoardAsync() {
  // TODO(backend): GET /api/my-collaborations (user-scoped via Bearer JWT)
  const projects = await getMyCollabProjects();
  return <MyCollabBoard projects={projects} />;
}

export default function MyCollaborationsPage() {
  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
    >
      <div className="page-enter flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<MyCollabBoardSkeleton />}>
          <MyCollabBoardAsync />
        </Suspense>
      </div>
    </AppShell>
  );
}
