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

/**
 * Client mirror of the backend SkillGuard format rules
 * (utils/SkillGuard.php) so an invalid name is rejected inline
 * before the round trip, with the same message. The blocklist
 * itself lives only on the server; its rejection comes back as
 * the ApiError message and is shown the same way.
 */
export function validateSkillName(name: string): string | null {
  const FORMAT =
    "Nama skill tidak valid. Pakai 2-30 karakter: huruf, angka, spasi, dan simbol + # . / - saja.";
  const LINK =
    "Nama skill tidak boleh berisi alamat web atau nomor telepon.";
  if (name.length < 2 || name.length > 30) return FORMAT;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} +#./-]*$/u.test(name)) return FORMAT;
  if (!/\p{L}/u.test(name)) return FORMAT;
  if (
    /(www\.|https?|\.(com|net|org|info|biz|io|co|id|xyz|site|online|top|vip|pro|bet|win|click|link)\b)/i.test(
      name,
    )
  )
    return LINK;
  const digits = (name.match(/\d/g) ?? []).length;
  if (/\d{8,}/.test(name) || (digits >= 6 && digits / name.length > 0.5))
    return LINK;
  if (/(.)\1{3,}/u.test(name.toLowerCase())) return FORMAT;
  return null;
}

/**
 * DELETE /api/skills/:id (auth required) — deletes one of the current
 * user's own PRIVATE skills (audit P2-10). System skills answer 403,
 * another user's private skill answers 403, and a skill still
 * referenced by a live collab answers 409 with the backend's message
 * ("Skill masih digunakan pada N kolaborasi..."); the caller surfaces
 * it inline (see MakeCollabModal). A skill referenced only by
 * soft-deleted collabs deletes fine (Batch 1: references count live
 * collabs only).
 */
export async function deleteSkill(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/api/skills/${id}`, {
    method: "DELETE",
  });
}

/** The template role tags are the backend's static system skills
 *  (scope "system": visible to everyone, cannot be deleted). This map
 *  only gives each of them its icon; its key order is the display
 *  order (the mockup's original order). */
export const SYSTEM_SKILL_ICONS: Record<string, string> = {
  Coding: "code-alt",
  "UI Design": "palette",
  Backend: "server",
  Testing: "bug",
  DevOps: "terminal",
  Mobile: "mobile-alt",
  Data: "bar-chart-alt-2",
  Writing: "pencil",
};
export const SYSTEM_SKILL_ORDER = Object.keys(SYSTEM_SKILL_ICONS);
