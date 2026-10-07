import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCollabProject } from "@/features/collaborations/api";
import { CollabDetailContent } from "@/features/collaborations/components/CollabDetailContent";
import { getNotifications } from "@/features/dashboard/api";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

interface CollabDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function CollabDetailPage({
  params,
}: CollabDetailPageProps) {
  const { projectId } = await params;
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