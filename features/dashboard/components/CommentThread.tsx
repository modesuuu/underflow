"use client";

import { type Ref } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { PostComment } from "../types";
import { LikeButton } from "./LikeButton";
import { resolvePersonId } from "@/features/profile/mock";

interface CommentItemProps {
  comment: PostComment;
  innerRef?: Ref<HTMLDivElement>;
}

function CommentItem({ comment, innerRef }: CommentItemProps) {
  const profileId = resolvePersonId(comment.author.id);
  const authorRow = (
    <>
      <Avatar size={32} src={comment.author.avatarUrl} alt={comment.author.name} />
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-base font-medium group-hover:underline">{comment.author.name}</span>
        <span className="inline-block size-[2px] rounded-full bg-subtle" />
        <span className="text-2xs text-subtle">{comment.postedAgo}</span>
      </div>
    </>
  );
  return (
    <div ref={innerRef} className="flex flex-col gap-3">
      {/* Author + time — profile link only for known people; generic
          mock commenters (user-1, user-2, …) stay plain text. */}
      {profileId ? (
        <Link
          href={`/profile/${profileId}`}
          className="group flex w-fit items-center gap-2"
          aria-label={`View ${comment.author.name}'s profile`}
        >
          {authorRow}
        </Link>
      ) : (
        <div className="flex items-center gap-2">{authorRow}</div>
      )}

      {/* Text */}
      <p className="text-base font-normal">{comment.text}</p>

      {/* Like — shared store so the like survives leaving and re-entering
          the detail page (session memory until the like API exists). */}
      <div className="w-fit">
        <LikeButton
          storeKey={`comment:${comment.id}`}
          initialLiked={comment.liked}
          initialLikes={comment.likes}
        />
      </div>
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