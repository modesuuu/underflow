// features/my-collaborations/api.ts
import { ApiEnvelope, apiFetch, ApiError, isApiConfigured } from "@/lib/api-client";
import { MY_COLLAB_PROJECTS } from "./mock";
import type { MyCollabProject } from "./types";

// TODO(backend): replace with GET /api/my-collaborations (user-scoped via
// Bearer JWT; contract envelope `{ data, meta }` — typed so the mock→fetch
// swap cannot change call sites, audit P1-A #8).
export async function getMyCollabProjects(): Promise<MyCollabProject[]> {
  if (isApiConfigured()) {
    const res = await apiFetch<ApiEnvelope<MyCollabProject[]>>(
    "/api/my-collaborations"
  );
    return res.data;
  }
  return MY_COLLAB_PROJECTS;
}

// TODO(backend): replace with GET /api/my-collaborations/:id
export async function getMyCollabProject(
  id: string
): Promise<MyCollabProject | undefined> {
  if (isApiConfigured()) {
    try {
      const res = await apiFetch<ApiEnvelope<MyCollabProject>>(
        `/api/my-collaborations/${id}`
      );
      return res.data;
    } catch (err) {
      // Unknown id → 404 envelope → undefined (page renders notFound()).
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }
  return MY_COLLAB_PROJECTS.find((p) => p.id === id);
}
