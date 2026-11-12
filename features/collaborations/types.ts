// features/collaborations/types.ts

export type ProjectStatus = "open" | "in-progress" | "completed";
export type ProjectType = "coursework" | "portfolio" | "product";

export interface CollabMember {
  id: string;
  name: string;
  /** e.g. "Owner • Fullstack", "UI Designer", "Open slot" */
  role: string;
  avatarUrl?: string;
  isOwner?: boolean;
  /** True for unfilled slots rendered as "Waiting...." */
  isOpenSlot?: boolean;
}

export interface SkillTag {
  id: string;
  label: string;
  /** Boxicons name without bx- prefix */
  icon?: string;
}

export interface CollabProject {
  id: string;
  title: string;
  /** Short subtitle shown on the card, e.g. "Need Frontend...." */
  subtitle: string;
  status: ProjectStatus;
  type: ProjectType;
  /**
   * ISO 8601 date (contract wire field, audit P1-A #5). The mock today
   * still supplies display strings — the `parseDueDate` helper in sort.ts
   * bridges it. TODO(contract): once the backend serves ISO dates, the
   * parse helpers become deletable and this becomes the single source.
   */
  dueDate: string;
  /** ISO 8601 timestamp (contract wire field). See `postedAgo` note. */
  postedAt?: string;
  /** Relative label, e.g. "3d ago" (frontend-only display field). */
  postedAgo: string;
  slotsFilled: number;
  slotsTotal: number;
  /**
   * The session user's application to this collab, when the authed
   * detail was fetched (the server render has no token, so it stays
   * null there and is filled in client-side). Drives the Apply CTA.
   */
  myApplication?: "pending" | "accepted" | "declined" | "withdrawn" | null;
  members: CollabMember[];
  skills: SkillTag[];
  description: string;
  /** Photo URLs (lime placeholders in mock) */
  photos: string[];
  /** Cloudinary public ids aligned by index with photos (null where
   *  the backend has none); the edit form sends them back paired with
   *  the URLs, as the update endpoint requires. */
  photoPublicIds: (string | null)[];
  owner: CollabMember;
}

export type CollabFilterType = ProjectType | "all";

export type CollabSortKey = "recommended" | "due" | "newest";
