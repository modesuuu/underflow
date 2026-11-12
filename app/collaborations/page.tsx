import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getCollabProjectsPage } from "@/features/collaborations/api";
import { CollabGrid } from "@/features/collaborations/components/CollabGrid";
import { CollabTopBarActions } from "@/features/collaborations/components/CollabTopBarActions";

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
 * (8-card grid), minus the AppShell and header which render now.
 * The search controls render live in the TopBar, not as a skeleton.
 */
function CollabGridSkeleton() {
  return (
    <>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="collab-card flex flex-col rounded-lg border border-line p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-6 w-24 rounded-full bg-placeholder" />
              <div className="h-6 w-16 rounded-full bg-placeholder/60" />
            </div>
            <div className="mt-3.5 h-5 w-2/3 rounded bg-placeholder" />
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="h-3.5 w-full rounded bg-placeholder/70" />
              <div className="h-3.5 w-4/5 rounded bg-placeholder/70" />
            </div>
            <div className="mt-auto flex gap-1.5 pt-4">
              <div className="h-6 w-16 rounded-full bg-placeholder/70" />
              <div className="h-6 w-20 rounded-full bg-placeholder/70" />
              <div className="h-6 w-14 rounded-full bg-placeholder/70" />
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-3.5">
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-24 rounded bg-placeholder" />
                <div className="h-3 w-16 rounded bg-placeholder/70" />
              </div>
              <div className="h-8 w-20 rounded-full bg-placeholder" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

async function CollabGridAsync() {
  // Server renders page 1 (default sort, no search); the grid fetches
  // further pages + search/sort pages client-side (audit P2-12).
  // A backend-down fetch does NOT throw here — it returns loadError
  // and the grid renders its error state (audit P2-9).
  const firstPage = await getCollabProjectsPage({ page: 1 });
  return <CollabGrid initial={firstPage} />;
}

export default function CollaborationsPage() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Collaborations"
      actions={<CollabTopBarActions />}
    >
      <div className="flex min-h-full flex-col gap-6 collab-ground px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
        {/* Page header — display heading + subheading. Base theme
            (Forest & Cream) since 2026-11-09; subheading restored
            on the user's order the same day. The search controls
            + New Project live in the TopBar now (same day). */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[40px] font-semibold uppercase leading-[1.05] tracking-[-0.02em] text-ink">
            Collaborations
          </h1>
          <p className="text-base text-muted">
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
