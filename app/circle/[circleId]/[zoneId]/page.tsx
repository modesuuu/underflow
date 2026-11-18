import { CircleZoneLoader } from "@/features/circle/components/CircleZoneLoader";

export default async function CircleZonePage({
  params,
}: {
  params: Promise<{ circleId: string; zoneId: string }>;
}) {
  const { circleId, zoneId } = await params;
  return <CircleZoneLoader circleId={circleId} zoneId={zoneId} />;
}
