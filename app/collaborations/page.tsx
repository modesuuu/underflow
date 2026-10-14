import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getCollabProjects } from "@/features/collaborations/api";
import { CollabGrid } from "@/features/collaborations/components/CollabGrid";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

export const metadata: Metadata = {
  title: "Collaborations",
  description:
    "Find portfolio projects, recruit your team, and ship real builds together.",
};

/**
 * The page renders its shell + static header synchronously and only suspends
 * on the data-bound section, so navigation shows this page's own shape
 * (header + its section skeleton) instead of the neutral root fallback.
 * The fallback is the section body of app/collaborations/loading.tsx
 * (toolbar + 8-card grid), minus the AppShell and header which render now.
 */
function CollabGridSkeleton() {
  return (
    <>
      {/* Toolbar mirrors SearchFilterBar: sort+filter icon buttons left,
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[235px] flex-col justify-between rounded-2xl border border-line bg-surface p-5"
          >
            {/* status row */}
            <div className="h-3.5 w-12 rounded bg-placeholder" />
            <div className="flex flex-col gap-2">
              <div className="h-7 w-4/5 rounded bg-placeholder" />
              <div className="h-4 w-3/5 rounded bg-placeholder" />
              <div className="h-3.5 w-24 rounded bg-placeholder" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-placeholder" />
                <div className="size-7 -ml-3 rounded-full bg-placeholder" />
              </div>
              <div className="h-10 w-24 rounded-xl bg-placeholder" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

async function CollabGridAsync() {
  // TODO(backend): GET /api/collaborations
  const projects = await getCollabProjects();
  return <CollabGrid projects={projects} />;
}

export default function CollaborationsPage() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Collaborations"
      actions={<CollabHeaderActions />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        {/* Page header — a working header, not a billboard: the
            page's job is scanning open projects, so the title is
            plain and the toolbar below does the talking. */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-semibold tracking-[-0.01em] text-ink">
            Collaborations
          </h1>
          <p className="text-sm text-muted">
            Open projects from students looking for teammates.
          </p>
        </div>

        {/* Search + filter + card grid */}
        <Suspense fallback={<CollabGridSkeleton />}>
          <CollabGridAsync />
        </Suspense>
      </div>
    </AppShell>
  );
}
