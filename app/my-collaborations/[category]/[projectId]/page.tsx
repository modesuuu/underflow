import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
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

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, projectId } = await params;

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
    >
      <MyCollabDetailContent project={project} />
    </AppShell>
  );
}
