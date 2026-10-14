"use client";

import { type CSSProperties, type Ref } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { PostComment } from "../types";
import { LikeButton } from "./LikeButton";
import { resolvePersonId } from "@/features/profile/mock";

interface CommentItemProps {
  comment: PostComment;
  innerRef?: Ref<HTMLDivElement>;
  isNew?: boolean;
}

/**
 * One comment — a two-column block (avatar rail + content column)
 * set one step quieter than the post it answers: 14px name and
 * Book body (the post is 15px), 12px time, a compact like. The
 * content column aligns under the name, so a comment reads as a
 * single block instead of stacked full-width rows.
 */
function CommentItem({ comment, innerRef, isNew = false }: CommentItemProps) {
  const profileId = resolvePersonId(comment.author.id);
  const profileHref = profileId ? `/profile/${profileId}` : null;
  const byline = (
    <>
      <span className="text-sm font-medium group-hover:underline">
        {comment.author.name}
      </span>
      <span className="inline-block size-[2px] rounded-full bg-subtle" />
      <span className="text-xs text-subtle">{comment.postedAgo}</span>
    </>
  );
  return (
    <div
      ref={innerRef}
      className={`flex gap-2.5 ${isNew ? "card-stagger" : ""}`}
      style={isNew ? ({ "--stagger-i": 0 } as CSSProperties) : undefined}
    >
      {/* Avatar rail — links to the profile for known people;
          generic mock commenters (user-1, user-2, …) stay plain. */}
      {profileHref ? (
        <Link
          href={profileHref}
          aria-label={`View ${comment.author.name}'s profile`}
          className="shrink-0 self-start"
        >
          <Avatar size={32} src={comment.author.avatarUrl} alt={comment.author.name} />
        </Link>
      ) : (
        <span className="shrink-0 self-start">
          <Avatar size={32} src={comment.author.avatarUrl} alt={comment.author.name} />
        </span>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {profileHref ? (
          <Link
            href={profileHref}
            className="group flex w-fit items-center gap-1.5"
            aria-label={`View ${comment.author.name}'s profile`}
          >
            {byline}
          </Link>
        ) : (
          <div className="flex items-center gap-1.5">{byline}</div>
        )}

        <p className="text-sm leading-relaxed">{comment.text}</p>

        {/* Like — compact variant; the shared store keeps it in
            step with every other surface (session memory until
            the like API exists). */}
        <div className="mt-0.5 w-fit">
          <LikeButton
            size="sm"
            storeKey={`comment:${comment.id}`}
            initialLiked={comment.liked}
            initialLikes={comment.likes}
          />
        </div>
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
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted">
        No comments yet — start the conversation.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          innerRef={comment.id === newCommentId ? newCommentRef : undefined}
          isNew={comment.id === newCommentId}
        />
      ))}
    </div>
  );
}
