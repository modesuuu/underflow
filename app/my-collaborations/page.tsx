import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MyCollabBoard } from "@/features/my-collaborations/components/MyCollabBoard";

export const metadata: Metadata = {
  title: "My Collaborations",
  description:
    "Track the projects you've joined or applied to, grouped by your progress.",
};

export default async function MyCollaborationsPage() {
  // TODO(backend): GET /api/my-collaborations (user-scoped via Bearer JWT)
  const projects = await getMyCollabProjects();

  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <MyCollabBoard projects={projects} />
      </div>
    </AppShell>
  );
}
