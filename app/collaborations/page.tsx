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
      {/* Toolbar mirrors the search-first SearchFilterBar */}
      <div className="flex items-center gap-3">
        <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
        <div className="h-11 w-24 rounded-xl bg-placeholder" />
        <div className="ms-auto flex items-center gap-2">
          <div className="h-11 w-32 rounded-xl bg-placeholder" />
          <div className="h-11 w-28 rounded-xl bg-placeholder" />
        </div>
      </div>

      {/* Index rows + preview pane */}
      <div className="flex items-start gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col divide-y divide-placeholder border-y border-placeholder">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-3 py-3.5">
                <div className="size-2 rounded-full bg-placeholder" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-4 w-2/5 rounded bg-placeholder" />
                  <div className="h-3 w-1/3 rounded bg-placeholder" />
                </div>
                <div className="h-3 w-16 rounded bg-placeholder" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-[380px] shrink-0 flex-col gap-4 rounded-2xl bg-bg p-5 lg:flex">
          <div className="aspect-[2/1] w-full rounded-xl bg-placeholder/60" />
          <div className="h-6 w-3/4 rounded bg-placeholder" />
          <div className="h-4 w-full rounded bg-placeholder" />
          <div className="h-4 w-2/3 rounded bg-placeholder" />
          <div className="h-11 w-full rounded-full bg-placeholder" />
        </div>
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
