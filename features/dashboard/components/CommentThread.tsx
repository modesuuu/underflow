"use client";

import { useState, type CSSProperties, type Ref } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { useSessionUser } from "@/features/auth/store";
import type { PostComment } from "../types";
import { reportComment, withdrawReport } from "../api";
import { LikeButton } from "./LikeButton";
import { CommentOptionsMenu } from "./CommentOptionsMenu";
import { ReportForm } from "./ReportForm";
import { ReportedPostNotice } from "./ReportedPostNotice";

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
 *
 * Other people's comments carry a ••• menu on the byline row:
 * Report swaps the comment body for the reason form and then the
 * reported notice, the same flow as reporting a post (the report
 * goes to the admin queue; Undo withdraws it).
 */
function CommentItem({ comment, innerRef, isNew = false }: CommentItemProps) {
  const profileHref = `/profile/${comment.author.id}`;
  const sessionUser = useSessionUser();
  const isOwn = sessionUser !== null && sessionUser.id === comment.author.id;
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportedId, setReportedId] = useState<string | null>(null);

  const handleReportSubmit = async (reason: string) => {
    const report = await reportComment(comment.id, reason);
    setReportedId(report.id);
    setReportFormOpen(false);
    setReported(true);
  };

  const handleUndoReport = async () => {
    if (reportedId) {
      try {
        await withdrawReport(reportedId);
      } catch {
        // Gagal menarik laporan tidak boleh menjebak tampilan.
      }
      setReportedId(null);
    }
    setReported(false);
  };

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
        <div className="flex items-start justify-between gap-2">
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
          {!isOwn && !reportFormOpen && !reported ? (
            <CommentOptionsMenu onReport={() => setReportFormOpen(true)} />
          ) : null}
        </div>

        {reportFormOpen ? (
          <ReportForm
            noun="comment"
            onCancel={() => setReportFormOpen(false)}
            onSubmit={handleReportSubmit}
          />
        ) : reported ? (
          <ReportedPostNotice noun="comment" onUndo={handleUndoReport} />
        ) : (
          <>
            <p className="text-sm leading-relaxed">{comment.text}</p>

            {/* Like — compact variant; the shared store keeps it in
                step with every other surface, persisted to the
                backend like a post like. */}
            <div className="mt-0.5 w-fit">
              <LikeButton
                size="sm"
                storeKey={`comment:${comment.id}`}
                initialLiked={comment.liked}
                initialLikes={comment.likes}
              />
            </div>
          </>
        )}
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
        No comments yet.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {comments.map((comment, i) => (
        <div
          key={comment.id}
          className={
            i < comments.length - 1 ? "border-b border-line pb-5" : undefined
          }
        >
          <CommentItem
            comment={comment}
            innerRef={comment.id === newCommentId ? newCommentRef : undefined}
            isNew={comment.id === newCommentId}
          />
        </div>
      ))}
    </div>
  );
}
