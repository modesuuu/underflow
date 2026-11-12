import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ApiError } from "@/lib/api-client";
import { getCollabProject } from "@/features/collaborations/api";
import type { CollabProject } from "@/features/collaborations/types";
import { CollabDetailContent } from "@/features/collaborations/components/CollabDetailContent";
import { CollabDetailError } from "@/features/collaborations/components/CollabDetailError";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

interface CollabDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: CollabDetailPageProps): Promise<Metadata> {
  const { projectId } = await params;
  let project: CollabProject | null = null;
  try {
    project = await getCollabProject(projectId);
  } catch {
    // Backend down: fall back to the generic title; the page body
    // renders the backend-down error state instead of a 404.
    project = null;
  }
  return {
    title: project ? `${project.title}` : "Collaboration",
    description: project?.subtitle ?? "Collaboration project detail.",
  };
}

/**
 * Fallback is the whole body of app/collaborations/[projectId]/loading.tsx
 * (which already includes its AppShell) because breadcrumbLeaf is the project
 * title — a data-bound value — so the shell cannot render synchronously.
 */
function CollabDetailLoadingBody() {
  return (
    <AppShell
      variant="detail"
      backLabel="Collaborations"
      backHref="/collaborations"
      breadcrumbRoot="Dashboard / Collaborations"
      panel={<NotificationsPanel className="px-6" />}
    >
      <div className="flex flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
        {/* Header band */}
        <div className="flex flex-col gap-4 rounded-lg p-6">
          <div className="h-6 w-24 rounded-full bg-bg" />
          <div className="h-10 w-2/3 rounded bg-placeholder" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 rounded bg-placeholder" />
            <div className="h-4 w-24 rounded bg-placeholder" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-md bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* Owner card */}
        <div className="flex flex-col gap-4 rounded-lg bg-bg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-[42px] rounded-full bg-placeholder" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 rounded bg-placeholder" />
                <div className="h-3 w-20 rounded bg-placeholder" />
              </div>
            </div>
            <div className="h-9 w-36 rounded-full bg-placeholder" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 rounded bg-placeholder" />
            <div className="h-3.5 w-full rounded bg-placeholder/70" />
            <div className="h-3.5 w-4/5 rounded bg-placeholder/70" />
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-3">
          <div className="h-6 w-40 rounded bg-placeholder" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-28 rounded-full bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 rounded bg-placeholder" />
            <div className="h-4 w-14 rounded bg-placeholder" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-placeholder" />
                <div className="flex flex-col gap-1">
                  <div className="h-3.5 w-20 rounded bg-placeholder" />
                  <div className="h-3 w-14 rounded bg-placeholder/70" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="flex items-center justify-center rounded-lg bg-bg p-6">
          <div className="h-12 w-44 rounded-md bg-placeholder" />
        </div>
      </div>
    </AppShell>
  );
}

async function CollabDetailAsync({ projectId }: { projectId: string }) {
  let project: CollabProject | null = null;
  let loadError = false;
  try {
    project = await getCollabProject(projectId);
  } catch (err) {
    // Backend down (network_error) is NOT a 404 — render the error
    // state below instead of notFound() (audit P2-9). Other failures
    // still throw to the route error boundary.
    if (err instanceof ApiError && err.code === "network_error") {
      loadError = true;
    } else {
      throw err;
    }
  }

  if (loadError) {
    return (
      <AppShell
        variant="detail"
        backLabel="Collaborations"
        backHref="/collaborations"
        breadcrumbRoot="Dashboard / Collaborations"
        panel={<NotificationsPanel className="px-6" />}
      >
        <CollabDetailError />
      </AppShell>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <AppShell
      variant="detail"
      backLabel="Collaborations"
      backHref="/collaborations"
      breadcrumbRoot="Dashboard / Collaborations"
      breadcrumbLeaf={project.title}
      panel={<NotificationsPanel className="px-6" />}
    >
      <CollabDetailContent project={project} />
    </AppShell>
  );
}

export default async function CollabDetailPage({
  params,
}: CollabDetailPageProps) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<CollabDetailLoadingBody />}>
      <CollabDetailAsync projectId={projectId} />
    </Suspense>
  );
}