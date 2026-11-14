"use client";

import { useState, type CSSProperties } from "react";
import { getFeedPage } from "../api";
import { Icon } from "@/components/ui/Icon";
import type { Post } from "../types";
import { LikeHydrator } from "./LikeHydrator";
import { PostCard } from "./PostCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The feed river: flat posts separated by rhythm, not boxes —
 * the page background is the surface. Entrance is the
 * codebase's card-stagger cascade (uf-card-in, --stagger-i),
 * capped so the tail lands inside the motion budget. Posting
 * lives in the TopBar's Post button; there is no composer here.
 */
const STAGGER_CAP = 8;

export function FeedColumn({
  posts,
  centered = false,
  feedTotal,
}: {
  posts: Post[];
  /** Center the column in the main area (feed page) instead of the
      default left-pinned 28px margin. Profile posts keeps the default. */
  centered?: boolean;
  /** Total posts on the server (feed page only): when set, a
      Show more button appends the next server page. Profile posts
      omits it and renders the plain list. */
  feedTotal?: number;
}) {
  const { t } = useLanguage();
  const [extraPosts, setExtraPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const allPosts = [...posts, ...extraPosts];
  const remaining =
    feedTotal !== undefined ? Math.max(0, feedTotal - allPosts.length) : 0;

  const showMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setMoreFailed(false);
    void getFeedPage(page + 1)
      .then((result) => {
        setPage(page + 1);
        setExtraPosts((prev) => {
          const seen = new Set([...posts, ...prev].map((p) => p.id));
          return [...prev, ...result.posts.filter((p) => !seen.has(p.id))];
        });
      })
      .catch(() => setMoreFailed(true))
      .finally(() => setLoadingMore(false));
  };

  return (
    <div
      className={
        centered
          ? "mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-3 lg:mx-auto lg:px-0"
          : "mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-3 lg:mx-0 lg:ml-[28px] lg:px-0"
      }
    >
      <LikeHydrator />
      {allPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="message-rounded" size={32} className="text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">{t("feed.noPostsTitle")}</p>
            <p className="text-sm text-muted">
              {t("feed.noPostsBody")}
            </p>
          </div>
        </div>
      ) : (
        allPosts.map((post, i) => (
          <div
            key={post.id}
            className="card-stagger"
            style={
              { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties
            }
          >
            <PostCard post={post} />
          </div>
        ))
      )}
      {remaining > 0 && (
        <div className="flex flex-col items-center gap-2 pt-1">
          {moreFailed && (
            <p className="text-sm text-muted">{t("feed.couldntLoadMore")}</p>
          )}
          <button
            type="button"
            onClick={showMore}
            disabled={loadingMore}
            className="pressable cursor-pointer rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {loadingMore
              ? t("feed.loadingEllipsis")
              : moreFailed
                ? t("modal.tryAgain")
                : t("feed.showMore", { count: remaining })}
          </button>
        </div>
      )}
    </div>
  );
}
