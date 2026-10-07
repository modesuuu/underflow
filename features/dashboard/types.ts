/** Data contracts for the dashboard feature (future backend response shapes). */

export interface PostAuthor {
  id: string;
  name: string;
  /** Absolute image URL; undefined renders the gray placeholder circle. */
  avatarUrl?: string;
}

export interface Photo {
  id: string;
  /** Absolute image URL; undefined renders the lime placeholder tile. */
  url?: string;
  alt: string;
}

export interface PostComment {
  id: string;
  author: PostAuthor;
  text: string;
  /** Relative label, e.g. "2 hours ago". */
  postedAgo: string;
  likes: number;
  /** Whether the current user already liked this comment. */
  liked: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
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

export type NotificationAction = "commented in" | "mentioned you in" | "invited you to";

export interface NotificationItem {
  id: string;
  actor: PostAuthor;
  action: NotificationAction;
  /** Project/workspace name the action points at. */
  target: string;
  /** Absolute-ish label, e.g. "Friday 3.12 PM". */
  timeLabel: string;
  /** Relative label, e.g. "2 hours ago". */
  agoLabel: string;
  unread: boolean;
}