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
            <div key={i} className="sheet flex flex-col gap-2 p-4">
              <div className="h-3.5 w-3/4 rounded-sm bg-placeholder" />
              <div className="h-3 w-1/2 rounded-sm bg-placeholder" />
            </div>
          ))}
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 py-6">
        {/* Header sheet */}
        <div className="sheet flex flex-col gap-4 p-6">
          <div className="h-6 w-24 rounded-pill border border-rule bg-placeholder/50" />
          <div className="h-9 w-2/3 rounded-sm bg-placeholder" />
          <div className="flex items-center gap-4">
            <div className="h-3.5 w-28 rounded-sm bg-placeholder" />
            <div className="h-3.5 w-24 rounded-sm bg-placeholder" />
          </div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[10px] w-[6px] rounded-[1px] bg-placeholder"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-sm bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* Owner + about sheet */}
        <div className="sheet flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 rounded-full bg-placeholder" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 rounded-sm bg-placeholder" />
                <div className="h-3 w-20 rounded-sm bg-placeholder" />
              </div>
            </div>
            <div className="h-8 w-32 rounded-sm border border-rule bg-placeholder/50" />
          </div>
          <div className="flex flex-col gap-2 border-t border-rule pt-5">
            <div className="h-3 w-32 rounded-sm bg-placeholder" />
            <div className="h-3.5 w-full rounded-sm bg-placeholder/70" />
            <div className="h-3.5 w-4/5 rounded-sm bg-placeholder/70" />
          </div>
          <div className="flex flex-col gap-2 border-t border-rule pt-5">
            <div className="h-3 w-36 rounded-sm bg-placeholder" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-2.5 w-4 shrink-0 rounded-sm bg-placeholder" />
                <div className="h-3 w-3/4 rounded-sm bg-placeholder" />
              </div>
            ))}
          </div>
        </div>

        {/* Skills sheet */}
        <div className="sheet flex flex-col gap-3 p-6">
          <div className="h-3 w-28 rounded-sm bg-placeholder" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-28 rounded-sm border border-rule bg-placeholder/50"
              />
            ))}
          </div>
        </div>

        {/* Team sheet */}
        <div className="sheet flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded-sm bg-placeholder" />
            <div className="flex gap-[3px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[10px] w-[6px] rounded-[1px] bg-placeholder"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-8 shrink-0 rounded-full bg-placeholder" />
                <div className="flex flex-col gap-1">
                  <div className="h-3.5 w-20 rounded-sm bg-placeholder" />
                  <div className="h-3 w-14 rounded-sm bg-placeholder/70" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply CTA sheet */}
        <div className="sheet flex items-center justify-center p-6">
          <div className="h-12 w-full rounded-sm bg-placeholder" />
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