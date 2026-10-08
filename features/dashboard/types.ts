/** Data contracts for the dashboard feature (future backend response shapes). */

export interface PostAuthor {
  id: string;
  name: string;
  /** Absolute image URL; undefined renders the gray placeholder circle. */
  avatarUrl?: string;
}

// `Photo` now lives in the shared UI layer (components/ui/PhotoGrid.tsx)
// so the dashboard feed and the collab detail page share one definition.
// Import it for local use (Post["photos"]) AND re-export it so existing
// `import { Photo } from "../types"` call sites keep working unchanged.
import type { Photo } from "@/components/ui/PhotoGrid";
export type { Photo };

export interface PostComment {
  id: string;
  author: PostAuthor;
  text: string;
  /**
   * ISO 8601 timestamp (contract wire field, audit P1-A #5). The frontend
   * formats it into a relative label once the backend serves it; the mock
   * today supplies `postedAgo` directly for display.
   */
  createdAt?: string;
  /** Relative label, e.g. "2 hours ago" (frontend-only display field). */
  postedAgo: string;
  likes: number;
  /** Whether the current user already liked this comment. */
  liked: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  /**
   * ISO 8601 timestamp (contract wire field, audit P1-A #5). The frontend
   * formats it into a relative label; the mock today also supplies
   * `postedAgo` for display.
   */
  postedAt?: string;
  /** Relative label shown under the author name, e.g. "2 hours ago". */
  postedAgo: string;
  text: string;
  /** Photo attachments; layout adapts to count (1/2/3/4/4+). */
  photos: Photo[];
  views: number;
  likes: number;
  /** Whether the current user already liked this post. */
  liked: boolean;
  /** Comments shown on the detail page. */
  comments: PostComment[];
}

export type NotificationAction =
  | "commented in"
  | "mentioned you in"
  | "invited you to";

/**
 * Aligned to the contract `Notification` shape (docs/api-contract.md):
 * `{ id, title, body?, createdAt, read, link? }`.
 *
 * The extra `actor` / `action` / `target` / `timeLabel` fields are a
 * frontend EXTENSION (audit P1-A #6 — "actor/action/target derived or
 * added to the contract — decide once"; decision here: keep as optional
 * extension fields so the panel can render rich rows without parsing
 * `title`, and the backend team confirms ownership in the contract).
 * `body` carries the derived line "Russel commented in SME Cashier App".
 * `timeLabel` replaces the old display-only time; `read` replaces `unread`.
 */
export interface NotificationItem {
  id: string;
  title: string;
  /** e.g. "Russel commented in SME Cashier App". */
  body?: string;
  /** ISO 8601 timestamp (contract wire field, audit P1-A #5). */
  createdAt: string;
  /** Contract field: true when already seen (inverse of the old `unread`). */
  read: boolean;
  /** Deep link, e.g. "/collaborations/collab-1". */
  link?: string;

  // Frontend extension fields (see note above):
  actor?: PostAuthor;
  action?: NotificationAction;
  /** Project/workspace name the action points at. */
  target?: string;
  /** Absolute-ish label, e.g. "Friday 3.12 PM". */
  timeLabel?: string;
  /** Relative label, e.g. "2 hours ago" (frontend-only display field). */
  agoLabel?: string;
}