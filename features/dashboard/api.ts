import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import type { NotificationItem, Post } from "./types";

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
    }),
  });
  return mapBackendPost(res.data);
}

// TODO(backend): GET /api/notifications does not exist yet (table added
// 2026-11-10, no route). Until the endpoint lands the list is empty.
export async function getNotifications(): Promise<NotificationItem[]> {
  return [];
}