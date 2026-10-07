import { AppShell } from "@/components/layout/AppShell";
import { getCollabProjects } from "@/features/collaborations/api";
import { CollabGrid } from "@/features/collaborations/components/CollabGrid";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

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
        {/* Page header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[40px] font-medium leading-tight">
            Collaborations
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
