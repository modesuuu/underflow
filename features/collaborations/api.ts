// features/collaborations/api.ts
import { apiFetch, isApiConfigured } from "@/lib/api-client";
import { COLLAB_PROJECTS } from "./mock";
import type { CollabProject } from "./types";

// TODO(backend): replace with GET /api/collaborations
export async function getCollabProjects(): Promise<CollabProject[]> {
  if (isApiConfigured()) {
    return apiFetch<CollabProject[]>("/collaborations");
  }
  return COLLAB_PROJECTS;
}

// TODO(backend): replace with GET /api/collaborations/:id
export async function getCollabProject(
  id: string
): Promise<CollabProject | undefined> {
  if (isApiConfigured()) {
    return apiFetch<CollabProject>(`/collaborations/${id}`);
  }
  return COLLAB_PROJECTS.find((p) => p.id === id);
}

// TODO(backend): replace with POST /api/collaborations
export async function createCollabProject(
  _data: Partial<CollabProject>
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    return apiFetch<{ success: boolean }>("/collaborations", {
      method: "POST",
      body: JSON.stringify(_data),
    });
  }
  return { success: true };
}

// TODO(backend): replace with POST /api/collaborations/:id/apply
export async function applyToCollab(
  _projectId: string
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    return apiFetch<{ success: boolean }>(
      `/collaborations/${_projectId}/apply`,
      { method: "POST" }
    );
  }
  return { success: true };
}