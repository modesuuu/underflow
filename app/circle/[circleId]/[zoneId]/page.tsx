import { CircleWorkspace } from "@/features/circle/components/CircleWorkspace";

/**
 * /circle/:circleId/:zoneId renders the one-page workspace with that
 * circle + zone preselected (deep links stay shareable; switching
 * inside the workspace is client state).
 */
export default async function CircleZonePage({
  params,
}: {
  params: Promise<{ circleId: string; zoneId: string }>;
}) {
  const { circleId, zoneId } = await params;
  return (
    <CircleWorkspace initialCircleId={circleId} initialZoneId={zoneId} />
  );
}
