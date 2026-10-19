import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCircle, getCircleProjects } from "@/features/circle/api";
import { CircleShell } from "@/features/circle/components/CircleShell";
import type { ChannelId } from "@/features/circle/types";

const CHANNEL_IDS: ChannelId[] = ["announcements", "general"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const projects = await getCircleProjects();
  const project = projects.find((p) => p.projectId === projectId);
  return { title: project ? `${project.title} — Circle — Underflow` : "Circle — Underflow" };
}

export default async function CircleChannelPage({
  params,
}: {
  params: Promise<{ projectId: string; channelId: string }>;
}) {
  const { projectId, channelId } = await params;
  if (!CHANNEL_IDS.includes(channelId as ChannelId)) notFound();
  const circle = await getCircle(projectId);
  if (!circle) notFound();
  const projects = await getCircleProjects();
  const summary = projects.find((p) => p.projectId === projectId);
  if (!summary) notFound();

  return (
    <AppShell
      fill
      breadcrumbRoot="Dashboard / Circle"
      breadcrumbLeaf={summary.title}
      backLabel="Circles"
      backHref="/circle"
      variant="detail"
    >
      <CircleShell
        projectId={projectId}
        channelId={channelId as ChannelId}
        title={summary.title}
        statusLabel={summary.statusLabel}
      />
    </AppShell>
  );
}
