// features/circle/types.ts
// Shapes for the Circle V1 mock (spec-circle-v1 §4). Field names follow
// the repo's conventions; the backend contract delta is a separate
// deliverable (spec §12) — nothing here changes docs/api-contract.md.

export type ChannelId = "announcements" | "general";
export type Presence = "online" | "idle" | "offline";

export interface CircleMember {
  userId: string;
  name: string;
  /** Slot role in the project; the owner reads "Project Owner". */
  role: string;
  isOwner: boolean;
  avatarUrl?: string;
  /** Static from the mock in V1; realtime presence is a backend phase. */
  presence: Presence;
}

export interface CircleReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface CircleAttachment {
  name: string;
  sizeBytes: number;
}

export interface CircleMessage {
  id: string;
  channelId: ChannelId;
  /** "system" for system messages (kind carries the distinction too). */
  authorId: string;
  kind: "user" | "system";
  body: string;
  /** ISO 8601. */
  createdAt: string;
  editedAt?: string;
  replyToId?: string;
  reactions: CircleReaction[];
  pinned: boolean;
  attachments: CircleAttachment[];
}

export interface CircleResource {
  id: string;
  kind: "figma" | "github" | "drive" | "link" | "deadline";
  label: string;
  /** Deadlines have no url. */
  url?: string;
  /** e.g. the date for a deadline. */
  note?: string;
  /** Set when the resource came from promoting a pinned message. */
  sourceMessageId?: string;
}

export interface CircleData {
  projectId: string;
  members: CircleMember[];
  /** All channels in one list; filter by channelId. */
  messages: CircleMessage[];
  resources: CircleResource[];
  /** Last-read message id per channel; null = nothing read yet. */
  lastRead: Record<ChannelId, string | null>;
}

/** One row of the /circle index (server-derived project facts). */
export interface CircleProjectSummary {
  projectId: string;
  title: string;
  /** My Collaborations status label, e.g. "Not Started". */
  statusLabel: string;
  memberNames: string[];
}
