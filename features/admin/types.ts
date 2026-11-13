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
