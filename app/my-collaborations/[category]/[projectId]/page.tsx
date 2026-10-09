import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { getMyCollabProject } from "@/features/my-collaborations/api";
import { MyCollabDetailContent } from "@/features/my-collaborations/components/MyCollabDetailContent";
import { getCategory } from "@/features/my-collaborations/types";
import { getNotifications } from "@/features/dashboard/api";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

interface DetailPageProps {
  params: Promise<{ category: string; projectId: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getMyCollabProject(projectId);
  return {
    title: project ? project.title : "My Collaborations",
    description: project?.subtitle ?? "My collaboration project detail.",
  };
}

/**
 * Exception case: breadcrumbLeaf is the project TITLE (a data-bound value),
 * so the AppShell cannot render synchronously. The page wraps the whole
 * detail in a <Suspense> whose fallback is the entire current
 * app/my-collaborations/[category]/[projectId]/loading.tsx body (which
 * already includes its own AppShell).
 */
function MyCollabDetailLoadingBody() {
  return (
    <AppShell
      panel={
        <div className="flex flex-col gap-5 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg bg-bg p-4">
              <div className="h-3.5 w-3/4 rounded bg-placeholder" />
              <div className="h-3 w-1/2 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      }
      variant="detail"
      backLabel="Category"
      backHref="/my-collaborations"
    >
      <div className="flex flex-col gap-6 px-6 pb-12 pt-6">
        {/* 1. Status row */}
        <div className="flex items-center gap-1.5">
          <div className="size-4 rounded bg-placeholder" />
          <div className="h-3.5 w-24 rounded bg-placeholder" />
        </div>

        {/* 2. Title + meta */}
        <div className="flex flex-col gap-4">
          <div className="h-10 w-2/3 rounded-lg bg-placeholder" />
          <div className="flex items-center gap-4">
            <div className="h-3.5 w-28 rounded bg-placeholder" />
            <div className="h-3.5 w-24 rounded bg-placeholder" />
          </div>
        </div>

        {/* 3. Photo grid — 2x2 like the adaptive PhotoGrid at 4 photos */}
        <div className="grid h-[306px] grid-cols-2 grid-rows-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md bg-placeholder/60" />
          ))}
        </div>

        {/* 4. Owner card + about + work items */}
        <div className="flex flex-col gap-4 rounded-2xl bg-bg p-6">
          <div className="h-3 w-24 rounded bg-placeholder" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-[42px] shrink-0 rounded-full bg-placeholder" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-28 rounded bg-placeholder" />
                <div className="h-3 w-20 rounded bg-placeholder" />
              </div>
            </div>
            <div className="h-9 w-36 rounded-full bg-placeholder" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-44 rounded bg-placeholder" />
            <div className="h-3 w-full rounded bg-placeholder" />
            <div className="h-3 w-5/6 rounded bg-placeholder" />
            <div className="h-3 w-2/3 rounded bg-placeholder" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-48 rounded bg-placeholder" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-1.5 shrink-0 rounded-full bg-placeholder" />
                <div className="h-3 w-3/4 rounded bg-placeholder" />
              </div>
            ))}
          </div>
        </div>

        {/* 5. Skills */}
        <div className="flex flex-col gap-3">
          <div className="h-5 w-28 rounded bg-placeholder" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* 6. Team — filled members + open slot */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 rounded bg-placeholder" />
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-10 rounded bg-placeholder" />
              <div className="size-5 rounded bg-placeholder" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-[32px] shrink-0 rounded-full bg-placeholder" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-24 rounded bg-placeholder" />
                  <div className="h-2.5 w-16 rounded bg-placeholder" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Bottom CTA — disabled "Closed" (presentational this phase) */}
        <div className="mx-auto h-12 w-64 rounded-full bg-placeholder" />
      </div>
    </AppShell>
  );
}

async function MyCollabDetailAsync({
  category,
  projectId,
}: {
  category: string;
  projectId: string;
}) {
  // Category must be a known slug AND match the project's own myStatus —
  // otherwise the URL is stale/wrong → 404.
  const cat = getCategory(category);
  if (!cat) notFound();

  const project = await getMyCollabProject(projectId);
  if (!project || project.myStatus !== cat.slug) notFound();

  const notifications = await getNotifications();

  return (
    <AppShell
      variant="detail"
      backLabel={cat.crumbLabel}
      backHref={`/my-collaborations/${cat.slug}`}
      breadcrumbRoot={`Tools / My Collaborations / ${cat.crumbLabel}`}
      breadcrumbLeaf={project.title}
      panel={<NotificationsPanel notifications={notifications} />}
      actions={<NotificationsBell />}
    >
      <MyCollabDetailContent project={project} />
    </AppShell>
  );
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, projectId } = await params;

  return (
    <Suspense fallback={<MyCollabDetailLoadingBody />}>
      <MyCollabDetailAsync category={category} projectId={projectId} />
    </Suspense>
  );
}
