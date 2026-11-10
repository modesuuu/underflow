// features/my-collaborations/api.ts
import { ApiEnvelope, apiFetch, ApiError, isApiConfigured } from "@/lib/api-client";
import { mapBackendCollab } from "@/features/collaborations/api";
import type { MyCollabProject } from "./types";

/** Wire item of GET /api/my-collaborations: the collab list shape plus my_status. */
interface BackendMyCollab {
  id: string;
  title: string;
  description?: string;
  type?: "coursework" | "portfolio" | "product";
  due_date?: string | null;
  status: "open" | "in-progress" | "completed";
  my_status: "not-started" | "pending" | "complete" | "revise";
  required_member: number;
  accepted_member_count: number;
  available_slots: number;
  skills_needed: { id: string; skill_name: string; scope: string }[];
  owner: { id: string; username: string; photo_profile_url: string };
  created_at?: string;
}

function mapBackendMyCollab(b: BackendMyCollab): MyCollabProject {
  return {
    ...mapBackendCollab(b),
    myStatus: b.my_status,
  };
}

export async function getMyCollabProjects(): Promise<MyCollabProject[]> {
  if (isApiConfigured()) {
    const res = await apiFetch<ApiEnvelope<BackendMyCollab[]>>(
      "/api/my-collaborations"
    );
    return res.data.map(mapBackendMyCollab);
  }
  return [];
}

// No backend detail route yet — resolve from the list.
export async function getMyCollabProject(
  id: string
): Promise<MyCollabProject | undefined> {
  const projects = await getMyCollabProjects();
  return projects.find((p) => p.id === id);
}
