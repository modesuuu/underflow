"use client";

import { useState, type Ref } from "react";
import clsx from "clsx";
import gsap from "gsap";
import { useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
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
    if (!liked && bumpRef.current) {
      gsap.fromTo(
        bumpRef.current,
        { scale: 1 },
        { scale: 1.35, duration: 0.15, ease: "power2.out", yoyo: true, repeat: 1 }
      );
    }
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
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
          <Icon
            name="heart"
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