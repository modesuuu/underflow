// features/collaborations/api.ts
import { ApiEnvelope, apiFetch, ApiError, isApiConfigured } from "@/lib/api-client";
import { COLLAB_PROJECTS } from "./mock";
import type { CollabProject, ProjectType } from "./types";

// TODO(backend): replace with GET /api/collaborations (contract envelope:
// `{ data, meta }` — typed so the mock→fetch swap cannot change call sites,
// audit P1-A #8).
export async function getCollabProjects(): Promise<CollabProject[]> {
  if (isApiConfigured()) {
    const res = await apiFetch<ApiEnvelope<CollabProject[]>>("/api/collaborations");
    return res.data;
  }
  return COLLAB_PROJECTS;
}

// TODO(backend): replace with GET /api/collaborations/:id
export async function getCollabProject(
  id: string
): Promise<CollabProject | undefined> {
  if (isApiConfigured()) {
    try {
      const res = await apiFetch<ApiEnvelope<CollabProject>>(
        `/api/collaborations/${id}`
      );
      return res.data;
    } catch (err) {
      // Unknown id → 404 envelope → undefined (page renders notFound()).
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }
  return COLLAB_PROJECTS.find((p) => p.id === id);
}

/**
 * Contract wire payload (docs/api-contract.md `CreateCollabInput`).
 * `photoUrls` come from a PRIOR POST /api/upload — the two-step
 * upload-then-create flow the contract mandates (audit P1-A #9).
 */
export interface CreateCollabInput {
  title: string;
  description: string;
  skillIds: string[]; // references SkillTag.id
  customRoles: string[];
  slotsTotal: number;
  type: ProjectType;
  dueDate: string; // ISO 8601
  photoUrls: string[];
}

/**
 * Form-level payload: raw Files instead of URLs — the api layer uploads them
 * first and swaps in the returned URLs. `type`/`dueDate` are contract-required
 * but the form does not collect them yet (later iteration); until the fields
 * land in the UI the payload omits them and the real backend 400s — expected.
 */
export interface CreateCollabFormInput
  extends Omit<CreateCollabInput, "photoUrls" | "type" | "dueDate"> {
  photos: File[];
  type?: ProjectType;
  dueDate?: string;
}

// TODO(backend): two-step — POST /api/upload (multipart), then
// POST /api/collaborations with the returned photoUrls.
export async function createCollabProject(
  data: CreateCollabFormInput
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    let photoUrls: string[] = [];
    if (data.photos.length > 0) {
      const form = new FormData();
      data.photos.forEach((file) => form.append("photos", file));
      // api-client skips the JSON Content-Type for FormData bodies
      // (multipart boundary is set by the browser, audit P1-A #10).
      const uploaded = await apiFetch<ApiEnvelope<{ urls: string[] }>>(
        "/api/upload",
        { method: "POST", body: form }
      );
      photoUrls = uploaded.data.urls;
    }
    const { photos: _omit, ...wire } = data;
    void _omit;
    await apiFetch<ApiEnvelope<CollabProject>>("/api/collaborations", {
      method: "POST",
      body: JSON.stringify({ ...wire, photoUrls }),
    });
    return { success: true };
  }
  return { success: true };
}

// TODO(backend): replace with POST /api/collaborations/:id/apply
export async function applyToCollab(
  _projectId: string
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    await apiFetch<ApiEnvelope<unknown>>(
      `/api/collaborations/${_projectId}/apply`,
      { method: "POST" }
    );
  }
  return { success: true };
}