// features/collaborations/types.ts

export type ProjectStatus = "open" | "in-progress" | "complete";
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
  dueDate: string;
  postedAgo: string;
  slotsFilled: number;
  slotsTotal: number;
  members: CollabMember[];
  skills: SkillTag[];
  description: string;
  /** Bullet points under "What you'll work on" */
  workItems: string[];
  /** Photo URLs (lime placeholders in mock) */
  photos: string[];
  owner: CollabMember;
}

export type CollabFilterType = ProjectType | "all";

export type CollabSortKey = "recommended" | "due" | "newest";

export type CollabStatusFilter = "all" | "open" | "in-progress";