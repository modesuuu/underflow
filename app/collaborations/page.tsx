import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getCollabProjects } from "@/features/collaborations/api";
import { CollabGrid } from "@/features/collaborations/components/CollabGrid";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

export const metadata: Metadata = {
  title: "Collaborations",
  description:
    "Find portfolio projects, recruit your team, and ship real builds together.",
};

export default async function CollaborationsPage() {
  // TODO(backend): GET /api/collaborations
  const projects = await getCollabProjects();

  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Collaborations"
      actions={<CollabHeaderActions />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        {/* Page header — P2 #15: display-style lockup (56px, tight leading,
            em italic accent on one word). Revert = restore the 40px/medium h1. */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[56px] font-bold leading-[1.02] tracking-[-0.02em] text-ink">
            Build in <em>collaboration</em>
          </h1>
          <p className="text-sm font-medium text-muted">
            Find projects to build your portfolio and recruit your team.
          </p>
        </div>

        {/* Search + filter + card grid */}
        <CollabGrid projects={projects} />
      </div>
    </AppShell>
  );
}
