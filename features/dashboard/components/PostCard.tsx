"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import type { Post } from "../types";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { CommentThread } from "./CommentThread";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
}

function LikeButton({ liked, count, onToggle }: LikeButtonProps) {
  const bumpRef = useRef<HTMLSpanElement>(null);

  const handleClick = () => {
    // WAAPI instead of GSAP: rapid re-clicks restart the same animation
    // (no stacked tweens -> no snap). transform-only. Like gets a spring-
    // style overshoot pop; unlike animates nothing (P1-F spec).
    if (!liked && bumpRef.current) {
      bumpRef.current.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.45)", offset: 0.4 },
          { transform: "scale(0.92)", offset: 0.7 },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
      );
    }
    onToggle();
  };

  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={handleClick}
      className="flex cursor-pointer items-center gap-1"
    >
      <span ref={bumpRef} className="inline-flex">
        <Icon
          name="heart"
          solid={liked}
          size={24}
          className={liked ? "text-heart" : "text-ink"}
        />
      </span>
      <span
        className={clsx(
          "text-2xs font-medium",
          liked ? "text-heart" : "text-ink"
        )}
      >
        {formatCount(count)}
      </span>
    </button>
  );
}

export function PostCard({ post, inlineComments }: { post: Post; inlineComments?: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const openDetail = () => router.push(`/dashboard/${post.id}`);
  const openDetailAtComment = () =>
    router.push(`/dashboard/${post.id}?focus=comment`);

  const toggleLike = () => {
    // Pure: no setState nested inside another updater (StrictMode double-fire
    // otherwise shifts the count by ±2 per click — audit P0-2).
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
  };

  return (
    <article className="flex flex-1 flex-col gap-6 py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar size={32} src={post.author.avatarUrl} alt={post.author.name} />
          <div className="flex flex-col ">
            <span className="text-base font-medium">{post.author.name}</span>
            <span className="text-2xs text-subtle">{post.postedAgo}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6">
        <p className="text-base font-medium">{post.text}</p>
        <div className="flex flex-col gap-6">
          {/* Photo click -> post detail page (replaces the old lightbox) */}
          <PhotoGrid photos={post.photos} onPhotoClick={openDetail} />
          {/* Counters */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Icon name="show-alt" size={24} className="text-ink" />
              <span className="text-2xs font-medium">
                {formatCount(post.views)}
              </span>
            </span>
            <LikeButton liked={liked} count={likeCount} onToggle={toggleLike} />
            {/* P1-F: the comment counter is back with a different job — it
                opens the thread INLINE in the card (no navigation). The
                detail page still renders the full thread separately; this
                toggle is only present in the feed (inlineComments). */}
            {inlineComments && (
              <button
                type="button"
                aria-expanded={commentsOpen}
                aria-label={`${commentsOpen ? "Hide" : "Show"} ${post.comments.length} comment${post.comments.length === 1 ? "" : "s"}`}
                onClick={() => setCommentsOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-1"
              >
                <Icon
                  name="message"
                  size={24}
                  className={commentsOpen ? "text-accent" : "text-ink"}
                />
                <span
                  className={clsx(
                    "text-2xs font-medium",
                    commentsOpen ? "text-accent" : "text-ink"
                  )}
                >
                  {formatCount(post.comments.length)}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline comment thread — grid-rows accordion (same pattern as the
          sidebar), never a raw height animation. CommentThread returns null
          for an empty array, so the empty-state text is rendered here. */}
      {inlineComments && (
        <div
          className={
            commentsOpen
              ? "acc-wrap [grid-template-rows:1fr]"
              : "acc-wrap [grid-template-rows:0fr]"
          }
        >
          <div className="acc-inner">
            <div className="flex flex-col gap-[42px] pt-2">
              {post.comments.length === 0 ? (
                <p className="text-sm text-muted">
                  No comments yet — be the first to share your thoughts.
                </p>
              ) : (
                <CommentThread comments={post.comments} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment bar */}
      <div className="flex items-center gap-3">
        <Avatar size={32} alt="You" />
        <button
          type="button"
          onClick={openDetailAtComment}
          className="flex flex-1 cursor-text items-center justify-between rounded-lg border border-accent bg-surface p-2 text-left"
        >
          <span className="text-base font-medium text-muted">
            Write your comment
          </span>
          <Icon name="send" size={24} className="text-accent" />
        </button>
      </div>
    </article>
  );
}