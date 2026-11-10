import { ApiEnvelope, apiFetch } from "@/lib/api-client";

/** A skill the user can attach to a collaboration (POST /api/skills). */
export interface Skill {
  id: string;
  name: string;
  scope?: string;
}

/** Wire shape of GET /api/skills (SkillModel::getVisibleForUser). */
interface BackendSkill {
  id: string;
  skill_name: string;
  scope?: string;
  created_by?: string;
}

function mapBackendSkill(b: BackendSkill): Skill {
  return {
    id: b.id,
    name: b.skill_name,
    scope: b.scope,
  };
}

/**
 * GET /api/skills (auth required) — the skills visible to the current user
 * (their own private skills + system skills). The New Project modal lists
 * these instead of the old hardcoded s1–s8 options, which do not exist in
 * the real skills table and made POST /api/collab answer 400 'not found'.
 */
export async function getSkills(): Promise<Skill[]> {
  const res = await apiFetch<ApiEnvelope<BackendSkill[]>>("/api/skills");
  return res.data.map(mapBackendSkill);
}

/**
 * POST /api/skills (auth required) — creates a PRIVATE skill for the
 * current user. A duplicate name for that user answers 409; the backend's
 * message is surfaced through ApiError.
 */
export async function createSkill(name: string): Promise<Skill> {
  const res = await apiFetch<ApiEnvelope<BackendSkill>>("/api/skills", {
    method: "POST",
    body: JSON.stringify({ skill_name: name }),
  });
  return mapBackendSkill(res.data);
}
