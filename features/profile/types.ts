import type { SkillTag } from "@/features/collaborations/types";

export type { SkillTag };

/** The three profile pages the shared rail navigates between. */
export type ProfileTab = "overview" | "posts" | "projects";

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
  /** Login handle, rendered as @username in the profile header. */
  username?: string;
  /** Profile photo URL (profiles.photo_profile_url); null renders initials. */
  avatarUrl?: string | null;
  /** Account creation timestamp (users.created_at) for "Member since". */
  createdAt?: string | null;
  /** Role line from the collab member pool, e.g. "Owner • Fullstack". */
  role?: string;
  bio?: string;
  /** Long-form markdown text for the Profile Detail card. */
  profileDetail?: string | null;
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

/**
 * Per-day collaboration activity from GET /api/users/:id/activity:
 * posts + visible comments + projects created + projects joined,
 * merged per calendar day over the last 182 days.
 */
export interface UserActivity {
  days: Record<string, number>;
  totals: {
    posts: number;
    comments: number;
    projectsCreated: number;
    projectsJoined: number;
    total: number;
  };
  since: string;
}
