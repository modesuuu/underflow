// features/circle/types.ts
// Shapes for Circle Phase 1 (backend foundation, 2026-11-18): a Circle
// belongs to one collaboration, holds Zones, and is reachable only by
// the owner + accepted members. The owner opts in — at collab creation
// or later — so a collaboration may have no Circle at all. Messaging
// types arrive with the Phase 2 endpoints; nothing here invents them.

export interface CircleZone {
  id: string;
  title: string;
  /** Resolved by the backend for the requesting user. */
  memberCanPost: boolean;
  /** Last-read message id; null until messaging lands (Phase 2). */
  lastRead: string | null;
}

export interface CircleMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  isOwner: boolean;
}

export interface CircleDetail {
  id: string;
  projectId: string;
  title: string;
  photoUrl: string | null;
  /** Raw collaboration status key from the backend ("open", ...). */
  status: string;
  zones: CircleZone[];
  members: CircleMember[];
}

/** One row of GET /api/circles (the /circle index). */
export interface CircleSummary {
  id: string;
  projectId: string;
  title: string;
  status: string;
  isOwner: boolean;
  memberNames: string[];
  memberCount: number;
}
