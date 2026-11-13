/**
 * Admin domain types (features/admin) — mirror the /api/admin/*
 * payloads from AdminModel/AdminController (spec-admin.md §7).
 */

export type AdminRole = "user" | "monitor" | "super_admin";

export interface AdminViewer {
  id: string;
  username: string;
  role: AdminRole;
}

export interface AdminActivity {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  strike: number;
  created_at: string;
  actor_name: string;
  owner_name: string | null;
}

export interface AdminOverview {
  users_total: number;
  users_new_today: number;
  users_new_7d: number;
  users_suspended: number;
  collabs_total: number;
  collabs_active: number;
  posts_total: number;
  posts_new_7d: number;
  reports_open: number;
  action_requests_pending: number;
  appeals_pending: number;
  recent_activity: AdminActivity[];
  viewer: AdminViewer | null;
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  provider: "password" | "google";
  photo_profile_url: string | null;
  role: AdminRole;
  account_status: "active" | "suspended";
  suspended_reason: string | null;
  suspended_at: string | null;
  created_at: string;
  post_count: number;
  collab_count: number;
  strike_count: number;
}

export interface AdminUserPost {
  id: string;
  description: string;
  view_count: number;
  moderation_state: "visible" | "removed";
  created_at: string;
}

export interface AdminUserCollab {
  id: string;
  title: string;
  status: string;
  moderation_state: "visible" | "removed";
  created_at: string;
  relation: "owner" | "member";
}

export interface AdminUserDetail {
  user: AdminUserRow & { full_name: string; bio: string };
  skills: string[];
  posts: AdminUserPost[];
  collabs: AdminUserCollab[];
  moderation_history: AdminActivity[];
  reports_open_against: number;
}

export type AdminContentType = "posts" | "comments" | "collabs";

export interface AdminContentItem {
  id: string;
  // posts
  description?: string;
  view_count?: number;
  comment_count?: string | number;
  // comments
  content?: string;
  post_id?: string;
  // collabs
  title?: string;
  status?: string;
  required_member?: number;
  member_count?: string | number;
  due_date?: string | null;
  // shared
  moderation_state: "visible" | "removed";
  removed_at: string | null;
  removal_reason: string | null;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_photo: string | null;
  report_count: string | number;
}

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Fase 2: moderation actions, requests, reports ──────────────────

export type ModerationActionType =
  | "remove_post"
  | "remove_comment"
  | "remove_collab"
  | "suspend_user"
  | "unsuspend_user"
  | "restore_content"
  | "dismiss_report";

export interface ActionRequestRow {
  id: string;
  requester_id: string;
  requester_name: string;
  action_type: string;
  target_type: string;
  target_id: string;
  target_label: string;
  reason: string;
  with_strike: boolean | number;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decider_name: string | null;
  decided_at: string | null;
  decision_note: string | null;
  executed_at: string | null;
  created_at: string;
}

export interface ReportItem {
  id: string;
  reason: string;
  created_at: string;
  reporter_name: string;
}

export interface ReportGroup {
  target_type: "post" | "comment" | "collab" | "user";
  target_id: string;
  open_count: number;
  first_at: string;
  target_label: string;
  target_state: string | null;
  owner_name: string | null;
  reports: ReportItem[];
}

/** The target bundle every moderation form works on. */
export interface ModerationTarget {
  actionType: ModerationActionType;
  targetType: string;
  targetId: string;
  targetLabel: string;
}

export interface AdminAppealRow {
  id: string;
  user_id: string;
  appellant_name: string;
  moderation_action_id: string;
  message: string;
  status: "pending" | "granted" | "denied";
  decision_note: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  action: {
    action_type: string;
    target_type: ModerationTarget;
    target_id: string;
    label: string | null;
    reason: string;
    actor_id: string;
    requested_by: string | null;
    created_at: string;
  };
  appellant_strikes: number;
  appellant_history: number;
}
