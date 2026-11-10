import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleChannelLoader } from "@/features/circle/components/CircleChannelLoader";
import type { ChannelId } from "@/features/circle/types";

const CHANNEL_IDS: ChannelId[] = ["announcements", "general"];

/**
 * The project title is not known on the server (the project list
 * needs the session token), so metadata stays generic; the loader
 * sets the breadcrumb once the summary loads client-side.
 */
export async function generateMetadata(): Promise<Metadata> {
  return { title: "Circle — Underflow" };
}

export default async function CircleChannelPage({
  params,
}: {
  params: Promise<{ projectId: string; channelId: string }>;
}) {
  const { projectId, channelId } = await params;
  if (!CHANNEL_IDS.includes(channelId as ChannelId)) notFound();
  return (
    <CircleChannelLoader
      projectId={projectId}
      channelId={channelId as ChannelId}
    />
  );
}
