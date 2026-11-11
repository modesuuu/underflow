import {
  ApiEnvelope,
  ApiError,
  apiFetch,
  isApiConfigured,
} from "@/lib/api-client";
import type { Post, PostComment } from "./types";

/** Wire shape of GET /api/posts (PostModel::getAll). */
interface BackendPost {
  id: string;
  user_id: string | { id: string; username: string; photo_profile_url?: string };
  title: string;
  description: string;
  portfolio_type: "link" | "images";
  external_url?: string | null;
  media_urls?: string[];
  view_count: number;
  like_count?: number;
  comment_count?: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  photo_profile_url?: string;
  owner?: { id: string; username: string; photo_profile_url?: string };
}

function relativeAgo(iso: string | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return days + "d ago";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return hours + "h ago";
  return "just now";
}

function mapBackendPost(b: BackendPost): Post {
  const owner =
    typeof b.user_id === "object"
      ? b.user_id
      : b.owner ?? {
          id: typeof b.user_id === "string" ? b.user_id : "",
          username: b.username ?? "",
          photo_profile_url: b.photo_profile_url,
        };
  return {
    id: b.id,
    author: {
      id: owner.id,
      name: owner.username,
      avatarUrl: owner.photo_profile_url || undefined,
    },
    postedAt: b.created_at,
    postedAgo: relativeAgo(b.created_at),
    text: b.description,
    photos: (b.media_urls ?? []).map((url, i) => ({
      id: b.id + "-photo-" + i,
      url,
      alt: b.title,
    })),
    views: b.view_count ?? 0,
    likes: b.like_count ?? 0,
    liked: b.is_liked ?? false,
    comments: [],
    commentCount: b.comment_count ?? 0,
  };
}

export async function getDashboardPosts(): Promise<Post[]> {
  if (!isApiConfigured()) {
    return [];
  }
  try {
    const res = await apiFetch<ApiEnvelope<BackendPost[]>>("/api/posts");
    return res.data.map(mapBackendPost);
  } catch (err) {
    // The backend answers 404 for an empty feed — that is an empty
    // list, not an error.
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      return [];
    }
    // Backend unreachable (server down): return an empty feed
    // instead of crashing the page.
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "network_error") {
      return [];
    }
    throw err;
  }
}

export interface CreatePostInput {
  title: string;
  description: string;
  media_urls: string[];
  /** Cloudinary public_ids, parallel to media_urls (optional). */
  media_public_ids?: string[];
}

/**
 * POST /api/posts (auth required). media_urls is optional — an empty
 * list posts text-only (backend relaxed 2026-11-10). portfolio_type
 * follows the media: 'images' when photos are attached, else 'link'.
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<BackendPost>>("/api/posts", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      portfolio_type: input.media_urls.length > 0 ? "images" : "link",
      media_urls: input.media_urls,
      media_public_ids: input.media_public_ids ?? [],
    }),
  });
  return mapBackendPost(res.data);
}

/**
 * POST /api/upload (auth required). Uploads ONE image file to Cloudinary
 * and returns its URL + public_id. The apiFetch FormData branch skips the
 * JSON Content-Type so the browser sets the multipart boundary itself.
 */
export async function uploadImage(file: File): Promise<{
  url: string;
  public_id: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch<
    ApiEnvelope<{ url: string; public_id: string }>
  >("/api/upload", { method: "POST", body: form });
  return res.data;
}

/** Wire shape of GET/POST /api/posts/:postId/comments (CommentModel). */
interface BackendComment {
  id: string;
  content: string;
  created_at?: string;
  createdAt?: string;
  userId?: { id: string; username: string; photo_profile_url?: string };
  user?: { id: string; username: string; photo_profile_url?: string };
  username?: string;
  photo_profile_url?: string;
  like_count?: number;
  is_liked?: boolean;
}

function mapBackendComment(c: BackendComment): PostComment {
  const author = c.userId ?? c.user ?? {
    id: "",
    username: c.username ?? "",
    photo_profile_url: c.photo_profile_url,
  };
  return {
    id: c.id,
    author: {
      id: author.id,
      name: author.username,
      avatarUrl: author.photo_profile_url || undefined,
    },
    text: c.content,
    createdAt: c.created_at ?? c.createdAt,
    postedAgo: relativeAgo(c.created_at ?? c.createdAt),
    likes: c.like_count ?? 0,
    liked: c.is_liked ?? false,
  };
}

/**
 * POST /api/posts/:postId/like (auth required). A 400 means the like
 * already exists ("Sudah like postingan ini") — treat as success so a
 * double-tap / retry cannot surface a spurious error.
 */
export async function likePost(postId: string): Promise<void> {
  try {
    await apiFetch("/api/posts/" + postId + "/like", { method: "POST" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) return;
    throw err;
  }
}

/** DELETE /api/posts/:postId/unlike (auth required). */
export async function unlikePost(postId: string): Promise<void> {
  await apiFetch("/api/posts/" + postId + "/unlike", { method: "DELETE" });
}

/**
 * POST /api/comments/:commentId/like (auth required). A 400 means the
 * like already exists — treat as success so a double-tap / retry
 * cannot surface a spurious error (same as likePost).
 */
export async function likeComment(commentId: string): Promise<void> {
  try {
    await apiFetch("/api/comments/" + commentId + "/like", { method: "POST" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) return;
    throw err;
  }
}

/** DELETE /api/comments/:commentId/unlike (auth required). */
export async function unlikeComment(commentId: string): Promise<void> {
  await apiFetch("/api/comments/" + commentId + "/unlike", { method: "DELETE" });
}

/** GET /api/posts/:postId/comments (auth required). Newest first. */
export async function getComments(postId: string): Promise<PostComment[]> {
  const res = await apiFetch<ApiEnvelope<BackendComment[]>>(
    "/api/posts/" + postId + "/comments"
  );
  return res.data.map(mapBackendComment);
}

/**
 * POST /api/posts/:postId/view (auth required) — records one view for
 * the post and returns the new view_count. Called once per detail open.
 */
export async function recordView(postId: string): Promise<{ viewCount: number }> {
  const res = await apiFetch<ApiEnvelope<{ view_count: number }>>(
    "/api/posts/" + postId + "/view",
    { method: "POST" }
  );
  return { viewCount: res.data.view_count };
}

/** POST /api/posts/:postId/comments (auth required). */
export async function postComment(
  postId: string,
  content: string
): Promise<PostComment> {
  const res = await apiFetch<ApiEnvelope<BackendComment>>(
    "/api/posts/" + postId + "/comments",
    { method: "POST", body: JSON.stringify({ content }) }
  );
  return mapBackendComment(res.data);
}

// Notifications live in ./notifications-api.ts (getNotifications /
// markNotificationRead / markAllNotificationsRead).