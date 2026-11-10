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
 * AppShell (the header and the project grid), which renders here
 * while getMyCollabProjects() suspends.
 */
function MyCollabBoardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header: title + subtitle left, search right */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-10 w-80 max-w-full rounded-lg bg-placeholder" />
          <div className="h-4 w-48 rounded bg-placeholder" />
        </div>
        <div className="h-10 w-56 rounded-full border border-line bg-surface" />
      </div>

      {/* Kanban: four column placeholders, each with a header + 3 cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
            <div className="flex items-center gap-2 px-1 pt-1">
              <div className="size-6 rounded-full bg-placeholder" />
              <div className="h-4 w-24 rounded bg-placeholder" />
              <div className="h-5 w-7 rounded-full bg-placeholder" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[168px] rounded-2xl bg-placeholder/50" />
            ))}
          </div>
        ))}
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
