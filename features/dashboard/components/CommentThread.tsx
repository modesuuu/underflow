"use client";

import { useState, type Ref } from "react";
import clsx from "clsx";
import { useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { Icon } from "@/components/ui/Icon";
import type { PostComment } from "../types";
import { formatCount } from "@/lib/format";

interface CommentItemProps {
  comment: PostComment;
  innerRef?: Ref<HTMLDivElement>;
}

function CommentItem({ comment, innerRef }: CommentItemProps) {
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const bumpRef = useRef<HTMLSpanElement>(null);

  const toggleLike = () => {
    // WAAPI instead of GSAP: rapid re-clicks restart the same animation
    // instead of stacking tweens -> no visible snap. Like gets a spring-style
    // overshoot pop; unlike animates nothing (P1-F spec, same as PostCard).
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
    // Pure state update (audit P0-2): no setState nested inside another
    // updater — StrictMode double-firing otherwise shifts the count ±2.
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
  };

  return (
    <div ref={innerRef} className="flex flex-col gap-3">
      {/* Author + time */}
      <div className="flex items-center gap-2">
        <Avatar size={32} src={comment.author.avatarUrl} alt={comment.author.name} />
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base font-medium">{comment.author.name}</span>
          <span className="inline-block size-[2px] rounded-full bg-subtle" />
          <span className="text-2xs text-subtle">{comment.postedAgo}</span>
        </div>
      </div>

      {/* Text */}
      <p className="text-base font-normal">{comment.text}</p>

      {/* Like */}
      <button
        type="button"
        aria-pressed={liked}
        onClick={toggleLike}
        className="flex w-fit cursor-pointer items-center gap-1"
      >
        <span ref={bumpRef} className="inline-flex">
          <HeartIcon
            filled={liked}
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
          {formatCount(likeCount)}
        </span>
      </button>
    </div>
  );
}

interface CommentThreadProps {
  comments: PostComment[];
  newCommentId?: string | null;
  newCommentRef?: Ref<HTMLDivElement>;
}

export function CommentThread({ comments, newCommentId, newCommentRef }: CommentThreadProps) {
  if (comments.length === 0) return null;
  return (
    <div className="flex flex-col gap-[42px]">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          innerRef={comment.id === newCommentId ? newCommentRef : undefined}
        />
      ))}
    </div>
  );
}