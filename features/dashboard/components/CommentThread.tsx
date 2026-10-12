"use client";

import { type Ref } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EntryNumber } from "@/components/ui/Sheet";
import type { PostComment } from "../types";
import { LikeButton } from "./LikeButton";

interface CommentItemProps {
  comment: PostComment;
  index: number;
  innerRef?: Ref<HTMLDivElement>;
}

/* A comment is an annotated line in the log's margin: a hairline rule to its
   left, the entry number, the author, the text, the like. */
function CommentItem({ comment, index, innerRef }: CommentItemProps) {
  return (
    <div ref={innerRef} className="flex gap-3">
      <div className="flex w-6 shrink-0 justify-end pt-0.5">
        <EntryNumber value={String(index + 1).padStart(2, "0")} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 border-l border-rule pl-4">
        <div className="flex items-center gap-2">
          <Avatar
            size={26}
            src={comment.author.avatarUrl}
            alt={comment.author.name}
          />
          <span className="text-sm font-medium text-ink">
            {comment.author.name}
          </span>
          <span className="font-figures text-2xs text-subtle">
            {comment.postedAgo}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-ink">{comment.text}</p>

        {/* Shared store: the like survives leaving and re-entering detail. */}
        <div className="w-fit">
          <LikeButton
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

export function CommentThread({
  comments,
  newCommentId,
  newCommentRef,
}: CommentThreadProps) {
  if (comments.length === 0) return null;
  return (
    <div className="flex flex-col gap-7">
      {comments.map((comment, i) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          index={i}
          innerRef={comment.id === newCommentId ? newCommentRef : undefined}
        />
      ))}
    </div>
  );
}