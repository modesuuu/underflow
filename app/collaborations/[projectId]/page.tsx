import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCollabProject } from "@/features/collaborations/api";
import { CollabDetailContent } from "@/features/collaborations/components/CollabDetailContent";
import { getNotifications } from "@/features/dashboard/api";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

interface CollabDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: CollabDetailPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getCollabProject(projectId);
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
      panel={
        <div className="flex flex-col gap-5 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg bg-bg p-4"
            >
              <div className="h-3.5 w-3/4 rounded bg-placeholder" />
              <div className="h-3 w-1/2 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      }
    >
      <div className="flex flex-col gap-6 px-6 pb-12 pt-6">
        {/* Header band */}
        <div className="flex flex-col gap-4 rounded-2xl p-6">
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
        <div className="flex flex-col gap-4 rounded-2xl bg-bg p-6">
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
        <div className="flex items-center justify-center rounded-2xl bg-bg p-6">
          <div className="h-12 w-44 rounded-md bg-placeholder" />
        </div>
      </div>
    </AppShell>
  );
}

async function CollabDetailAsync({ projectId }: { projectId: string }) {
  // TODO(backend): GET /api/collaborations/:id
  const project = await getCollabProject(projectId);
  if (!project) {
    notFound();
  }

  // Right panel: reuse the dashboard notifications mock (read-only)
  const notifications = await getNotifications();

  return (
    <AppShell
      variant="detail"
      backLabel="Collaborations"
      backHref="/collaborations"
      breadcrumbRoot="Dashboard / Collaborations"
      breadcrumbLeaf={project.title}
      panel={<NotificationsPanel notifications={notifications} />}
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