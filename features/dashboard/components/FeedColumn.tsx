"use client";

import type { CSSProperties } from "react";
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
}: {
  posts: Post[];
  /** Center the column in the main area (feed page) instead of the
      default left-pinned 28px margin. Profile posts keeps the default. */
  centered?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={
        centered
          ? "mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-3 lg:mx-auto lg:px-0"
          : "mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-3 lg:mx-0 lg:ml-[28px] lg:px-0"
      }
    >
      <LikeHydrator />
      {posts.length === 0 ? (
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
        posts.map((post, i) => (
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
    </div>
  );
}
