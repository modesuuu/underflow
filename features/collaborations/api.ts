// features/collaborations/api.ts
import { apiFetch, isApiConfigured } from "@/lib/api-client";
import { COLLAB_PROJECTS } from "./mock";
import type { CollabProject, SkillTag } from "./types";

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

/**
 * Extended create-payload accepted by the form. `photos` are the raw Files
 * (backend uploads them via /api/upload and replaces with URLs); `customRoles`
 * are free-text role labels the owner added.
 */
export interface CreateCollabInput {
  title: string;
  description: string;
  skills?: SkillTag[];
  slotsTotal?: number;
  photos?: File[];
  customRoles?: string[];
}

// TODO(backend): replace with POST /api/collaborations
export async function createCollabProject(
  _data: CreateCollabInput
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    // Photos flow into a multipart upload once /api/upload exists;
    // customRoles are sent as-is.
    const { photos: _photos, ...rest } = _data;
    void _photos;
    return apiFetch<{ success: boolean }>("/collaborations", {
      method: "POST",
      body: JSON.stringify(rest),
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