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
  /** Raw zone permission from the backend (settings UI). */
  allowPublicMessage: boolean;
  /** Messages from others the user has not read yet. */
  unreadCount: number;
  /** Read up to this timestamp (zone_reads); null if never read. */
  lastRead: string | null;
  /** Unread messages that mention the user (@username, or a
      certified @everyone from the owner). */
  mentionCount: number;
  /** Earliest unread mentioning message (jump target). */
  firstMentionId: string | null;
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
  photoProfileUrl: string | null;
  unreadCount: number;
  mentionCount: number;
  status: string;
  isOwner: boolean;
  memberNames: string[];
  memberCount: number;
}

/** The quoted original attached to a reply message. */
export interface ZoneReplyPreview {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
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
  /** Id of the quoted message when this message is a reply. */
  replyToId: string | null;
  /** The quoted original (null when this is not a reply, or the
      original no longer exists). */
  replyTo: ZoneReplyPreview | null;
  /** Certified by the backend: content tags @everyone AND the
      author is the circle owner. A member typing @everyone just
      sends plain text (Discord rule). */
  mentionsEveryone: boolean;
}

/** One page of zone history: chronological order + older-page flag. */
export interface ZoneMessagePage {
  messages: ZoneMessage[];
  hasMore: boolean;
}
