// features/circle/types.ts
// Shapes for Circle Phase 1 (backend foundation, 2026-11-18): a Circle
// belongs to one collaboration, holds Zones, and is reachable only by
// the owner + accepted members. The owner opts in — at collab creation
// or later — so a collaboration may have no Circle at all. Messaging
// types arrived with the Phase 2 endpoints (ZoneMessage below).

export interface CircleZone {
  id: string;
  title: string;
  /** Resolved by the backend for the requesting user. */
  memberCanPost: boolean;
  /** Last-read message id; read state is a later phase, still null. */
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

/** One zone message (GET/POST /api/circles/:id/zones/:zoneId/messages). */
export interface ZoneMessage {
  id: string;
  zoneId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  /** Backend DATETIME string ("YYYY-MM-DD HH:mm:ss", server time). */
  createdAt: string;
}

/** One page of zone history: chronological order + older-page flag. */
export interface ZoneMessagePage {
  messages: ZoneMessage[];
  hasMore: boolean;
}
