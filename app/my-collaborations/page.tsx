import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MyCollabBoard } from "@/features/my-collaborations/components/MyCollabBoard";

export const metadata: Metadata = {
  title: "My Collaborations",
  description:
    "Track the projects you've joined or applied to, grouped by your progress.",
};

/**
 * Fallback = the body of app/my-collaborations/loading.tsx minus its AppShell
 * (stat cards + toolbar + 4 board columns), which renders here while
 * getMyCollabProjects() suspends.
 */
function MyCollabBoardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col gap-3 rounded-xl border border-line bg-surface p-5"
          >
            <div className="size-9 rounded-md bg-placeholder" />
            <div className="h-8 w-16 rounded bg-placeholder" />
            <div className="h-3 w-24 rounded bg-placeholder" />
          </div>
        ))}
      </div>
      {/* Toolbar mirrors MyCollabSearchBar: sort+filter icon buttons left,
          search group (input + Search button) right */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-[42px] rounded-sm bg-placeholder" />
          <div className="size-[42px] rounded-sm bg-placeholder" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-[42px] w-64 items-center gap-2 rounded-md border border-line bg-surface px-4">
            <div className="size-4 shrink-0 rounded-full bg-placeholder" />
            <div className="h-3 flex-1 rounded bg-placeholder" />
          </div>
          <div className="h-[42px] w-24 rounded-md bg-placeholder" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl bg-placeholder/40 p-4"
          >
            <div className="h-6 w-2/3 rounded-full bg-bg" />
            <div className="h-40 rounded-xl bg-placeholder/60" />
            <div className="h-10 rounded-md bg-bg" />
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
      actions={<NotificationsBell />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <Suspense fallback={<MyCollabBoardSkeleton />}>
          <MyCollabBoardAsync />
        </Suspense>
      </div>
    </AppShell>
  );
}
