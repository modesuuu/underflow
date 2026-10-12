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
 * on the data-bound section, so navigation shows this page's own shape.
 * The fallback mirrors the section body (toolbar + card grid).
 */
function CollabGridSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-[42px] rounded-sm border border-rule bg-placeholder/50" />
          <div className="size-[42px] rounded-sm border border-rule bg-placeholder/50" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-[38px] w-64 border-b border-rule" />
          <div className="h-[38px] w-24 rounded-sm bg-placeholder" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[235px] flex-col gap-3 rounded-lg border border-rule bg-surface p-5"
          >
            <div className="h-4 w-20 rounded-sm bg-placeholder" />
            <div className="h-6 w-4/5 rounded-sm bg-placeholder" />
            <div className="h-3.5 w-3/5 rounded-sm bg-placeholder" />
            <div className="mt-2 flex gap-[3px]">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="h-[10px] w-[6px] rounded-[1px] bg-placeholder" />
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-rule pt-3">
              <div className="flex items-center">
                <div className="size-7 rounded-full bg-placeholder" />
                <div className="-ml-2.5 size-7 rounded-full bg-placeholder" />
              </div>
              <div className="h-7 w-20 rounded-sm bg-placeholder" />
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
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-8 py-8">
        {/* Page header — a log opening: a hairline rule, then the title. */}
        <div className="flex flex-col gap-2 border-b border-ink pb-4">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-ink">
            Build in collaboration
          </h1>
          <p className="text-sm text-muted">
            Find projects to build your portfolio and recruit your team.
          </p>
        </div>

        <Suspense fallback={<CollabGridSkeleton />}>
          <CollabGridAsync />
        </Suspense>
      </div>
    </AppShell>
  );
}