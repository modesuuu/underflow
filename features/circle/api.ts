// features/circle/api.ts
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MY_COLLAB_CATEGORIES } from "@/features/my-collaborations/types";
import { buildCircleData } from "./mock";
import type { CircleData, CircleProjectSummary } from "./types";

// TODO(backend): replace with GET /api/collaborations/:id/circle plus the
// WebSocket channel from the contract delta (spec-circle-v1 §12). Until
// then, the project list comes from the real My Collaborations API
// (a project has a Circle unless the user's application is still
// `pending`) while channels/messages/members stay mock.

/** Projects the current user has a Circle for (application not pending). */
async function eligibleProjects() {
  const projects = await getMyCollabProjects();
  return projects.filter((p) => p.myStatus !== "pending");
}

export async function getCircle(
  projectId: string,
): Promise<CircleData | undefined> {
  const project = (await eligibleProjects()).find((p) => p.id === projectId);
  if (!project) return undefined;
  return buildCircleData(project);
}

export async function getCircleProjects(): Promise<CircleProjectSummary[]> {
  const projects = await eligibleProjects();
  return projects.map((project) => {
    const data = buildCircleData(project);
    return {
      projectId: project.id,
      title: project.title,
      statusLabel:
        MY_COLLAB_CATEGORIES.find((c) => c.slug === project.myStatus)
          ?.crumbLabel ?? project.myStatus,
      members: data.members.map((m) => ({
        userId: m.userId,
        name: m.name,
      })),
    };
  });
}

