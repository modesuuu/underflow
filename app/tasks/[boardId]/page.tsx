import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PlannerBoardPage } from "@/features/planner/components/PlannerBoardPage";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Weekly planner board for your project tasks.",
};

/**
 * One board's page. The board id in the URL selects which
 * board (team or personal) the canvas shows; /tasks itself
 * forwards to the first board.
 */
export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  return (
    <AppShell breadcrumbRoot="Dashboard" breadcrumbLeaf="Tasks">
      <div className="page-enter px-4 py-6 sm:px-6 sm:py-8">
        <PlannerBoardPage boardId={boardId} />
      </div>
    </AppShell>
  );
}
