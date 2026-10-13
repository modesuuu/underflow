import type { SkillTag } from "@/features/collaborations/types";

export type { SkillTag };

/** One social link on a profile (rendered as a lime circle with a brand glyph). */
export interface PersonSocial {
  label: string;
  /** Boxicons brand name without the bxl- prefix, e.g. "instagram". */
  icon: string;
  href?: string;
}

/**
 * Profile-page detail for a person who already exists in the feature mocks.
 * The same human carries different ids per feature (a post author
 * "user-russel" is the collab member "m-owner"), so a person record keeps
 * EVERY known id in `aliases`; `id` is the canonical one used in
 * /profile/[userId] links. TODO(backend): replace with GET /api/users/:id
 * once the backend serves a single person id across features.
 */
export interface PersonDetail {
  id: string;
  aliases: string[];
  name: string;
  /** Role line from the collab member pool, e.g. "Owner • Fullstack". */
  role?: string;
  bio?: string;
  email?: string;
  socials?: PersonSocial[];
  skills?: SkillTag[];
}

/** The three Performance Summary figures, always computed from the mocks. */
export interface ProfileStats {
  completeProjects: number;
  postFeed: number;
  activeProjects: number;
}
