"use client";

import { useEffect } from "react";
import { useSessionUser } from "@/features/auth/store";
import { getDashboardPosts } from "../api";
import { syncLikeCount, syncLiked } from "../like-store";

/**
 * Client-side like hydration. Renders nothing.
 *
 * The feed and the post detail page are server components: they fetch
 * /api/posts WITHOUT a token (a server component cannot read the
 * localStorage session), so the backend returns is_liked=false for every
 * post and the LikeButton seeds its heart as unfilled — even for posts the
 * user already liked. The count is right (it is a server-side total), so
 * the bug shows as "count 1, heart empty" after a re-login.
 *
 * This component re-fetches the post list from the browser once a session
 * exists — apiFetch attaches the Bearer token — and syncs each post's
 * liked state + count into the shared like-store (keyed by post id, so it
 * fixes the feed card and the detail page at once). Best-effort: a failed
 * fetch never crashes the page, and it only runs when a user is logged
 * in. It runs once per mount and again when the session user changes
 * (login / logout / switch account). The syncs are no-ops when the value
 * is unchanged, so a repeated run is harmless.
 */
export function LikeHydrator() {
  const user = useSessionUser();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const posts = await getDashboardPosts();
        if (cancelled) return;
        for (const post of posts) {
          syncLiked(post.id, post.liked);
          syncLikeCount(post.id, post.likes);
        }
      } catch {
        // Backend down / 500 — the server-seeded values stay; never crash.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return null;
}
