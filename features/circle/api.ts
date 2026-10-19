// features/circle/api.ts
import { MY_COLLAB_PROJECTS } from "@/features/my-collaborations/mock";
import { MY_COLLAB_CATEGORIES } from "@/features/my-collaborations/types";
import { buildCircleData, eligibleProjects } from "./mock";
import type { CircleData, CircleProjectSummary } from "./types";

// TODO(backend): replace with GET /api/collaborations/:id/circle plus the
// WebSocket channel from the contract delta (spec-circle-v1 §12). The mock
// fallback keeps the same shapes so call sites do not change.

export async function getCircle(
  projectId: string,
): Promise<CircleData | undefined> {
  const project = eligibleProjects().find((p) => p.id === projectId);
  if (!project) return undefined;
  return buildCircleData(project);
}

export async function getCircleProjects(): Promise<CircleProjectSummary[]> {
  return eligibleProjects().map((project) => {
    const data = buildCircleData(project);
    return {
      projectId: project.id,
      title: project.title,
      statusLabel:
        MY_COLLAB_CATEGORIES.find((c) => c.slug === project.myStatus)
          ?.crumbLabel ?? project.myStatus,
      memberNames: data.members.map((m) => m.name),
    };
  });
}

export function circleProjectTitle(projectId: string): string | undefined {
  return MY_COLLAB_PROJECTS.find((p) => p.id === projectId)?.title;
}
