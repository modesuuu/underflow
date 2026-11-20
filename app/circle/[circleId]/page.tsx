import { CircleWorkspace } from "@/features/circle/components/CircleWorkspace";

/**
 * /circle/:circleId renders the one-page workspace with that circle
 * preselected (deep links and the "Open Circle" actions land here).
 */
export default async function CircleHomePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  return <CircleWorkspace initialCircleId={circleId} />;
}
