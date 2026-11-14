import {
  ApiEnvelope,
  ApiError,
  apiFetch,
  isApiConfigured,
} from "@/lib/api-client";
import type { Post, PostComment } from "./types";
import { formatRelativeAgo } from "@/lib/i18n/format";

/** Wire shape of GET /api/posts (PostModel::getAll). */
interface BackendPost {
  id: string;
  user_id: string | { id: string; username: string; photo_profile_url?: string };
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
  return formatRelativeAgo(iso);
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
      alt: "Post photo",
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
      description: input.description,
      portfolio_type: input.media_urls.length > 0 ? "images" : "link",
      media_urls: input.media_urls,
      media_public_ids: input.media_public_ids ?? [],
    }),
  });
  return mapBackendPost(res.data);
}

/**
 * Direct upload to Cloudinary (sejak 2026-11-12). The file no longer
 * passes through the backend: (1) ask the backend for an upload
 * signature (POST /api/upload/signature, auth required, rate-limited,
 * recorded server-side), (2) upload the file straight to Cloudinary
 * with that signature, (3) return the same { url, public_id } shape
 * as before so callers (PostModal, collaborations) do not change.
 * The Cloudinary api_secret never leaves the server; the signature
 * locks the target folder and carries the uploader's tag.
 */
export async function uploadImage(file: File): Promise<{
  url: string;
  public_id: string;
}> {
  const sigRes = await apiFetch<
    ApiEnvelope<{
      cloud_name: string;
      api_key: string;
      timestamp: number;
      signature: string;
      folder: string;
      tags: string;
    }>
  >("/api/upload/signature", { method: "POST", body: JSON.stringify({}) });
  const s = sigRes.data;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", s.api_key);
  form.append("timestamp", String(s.timestamp));
  form.append("signature", s.signature);
  form.append("folder", s.folder);
  form.append("tags", s.tags);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${s.cloud_name}/image/upload`,
    { method: "POST", body: form },
  );
  const data = (await res.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;

  if (!res.ok || !data?.secure_url || !data?.public_id) {
    throw new Error(
      data?.error?.message
        ? `Gagal mengunggah gambar: ${data.error.message}`
        : "Gagal mengunggah gambar. Coba lagi.",
    );
  }

  return { url: data.secure_url, public_id: data.public_id };
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
 * PUT /api/posts/:postId (auth required, owner only). Only the
 * description is edited — no media fields are sent, so the backend
 * leaves the post's photos untouched.
 */
export async function updatePost(
  postId: string,
  input: { description: string }
): Promise<void> {
  await apiFetch("/api/posts/" + postId, {
    method: "PUT",
    body: JSON.stringify({ description: input.description }),
  });
}

/** DELETE /api/posts/:postId (auth required, owner only; soft delete). */
export async function deletePost(postId: string): Promise<void> {
  await apiFetch("/api/posts/" + postId, { method: "DELETE" });
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

/**
 * POST /api/reports (auth required) — report a post to the admin
 * moderation queue (spec-admin.md §4.3). Returns the report so the
 * notice's Undo can withdraw it again by id.
 */
export async function reportPost(
  postId: string,
  reason: string
): Promise<{ id: string }> {
  const res = await apiFetch<ApiEnvelope<{ report: { id: string } }>>(
    "/api/reports",
    {
      method: "POST",
      body: JSON.stringify({
        target_type: "post",
        target_id: postId,
        reason,
      }),
    }
  );
  return res.data.report;
}

/**
 * POST /api/reports (auth required) — report a comment to the admin
 * moderation queue. Same contract as reportPost; Undo withdraws it
 * again through withdrawReport.
 */
export async function reportComment(
  commentId: string,
  reason: string
): Promise<{ id: string }> {
  const res = await apiFetch<ApiEnvelope<{ report: { id: string } }>>(
    "/api/reports",
    {
      method: "POST",
      body: JSON.stringify({
        target_type: "comment",
        target_id: commentId,
        reason,
      }),
    }
  );
  return res.data.report;
}

/** DELETE /api/reports/:id (auth required) — withdraw my open report. */
export async function withdrawReport(reportId: string): Promise<void> {
  await apiFetch("/api/reports/" + reportId, { method: "DELETE" });
}
