import { notFound, redirect } from "next/navigation";
import { getCircle } from "@/features/circle/api";

export default async function CircleProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const circle = await getCircle(projectId);
  if (!circle) notFound();
  redirect(`/circle/${projectId}/general`);
}
