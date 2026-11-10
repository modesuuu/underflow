import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import { COLLAB_PROJECTS } from "@/features/collaborations/mock";
import { NOTIFICATIONS, POSTS } from "./mock";
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
    return POSTS;
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
    throw err;
  }
}

// Tap-to-open, but only to destinations that exist: a link whose
// target is not in the local registries resolves to nothing, and
// pressing that row only marks it read instead of navigating to
// a dead page. TODO(backend): the server should validate links when
// the API is live; keep this check as the seatbelt.
function resolveNotificationHref(item: NotificationItem): string | undefined {
  const collab = item.link?.match(/^\/collaborations\/([\w-]+)$/);
  if (collab && COLLAB_PROJECTS.some((p) => p.id === collab[1])) {
    return item.link;
  }
  return undefined;
}

// TODO(backend): GET /api/notifications does not exist yet (table added
// 2026-11-10, no route). Keep the mock until the endpoint lands.
export async function getNotifications(): Promise<NotificationItem[]> {
  const items = NOTIFICATIONS;
  return items.map((item) => ({
    ...item,
    href: resolveNotificationHref(item),
  }));
}