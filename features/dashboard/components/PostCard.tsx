"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/components/layout/nav";
import { useSessionUser } from "@/features/auth/store";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import type { Post } from "../types";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { LikeButton } from "./LikeButton";
import { useCommentCount } from "../comment-count-store";
import { PostOptionsMenu } from "./PostOptionsMenu";
import { PostModal } from "./PostModal";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import { deletePost, reportPost, withdrawReport } from "../api";
import { toast } from "sonner";
import { ReportedPostNotice } from "./ReportedPostNotice";
import { ReportForm } from "./ReportForm";

/**
 * Feed post: flat on the page surface — no card border (the
 * user pulled the bordered treatment back out). Rhythm and the
 * internal hairline above the comment entry separate posts.
 * Body text reads in Book, not Medium.
 */
const CARD_CHROME = "px-1 py-2";

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [reported, setReported] = useState(false);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportedId, setReportedId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);
  // Subscribe to the session so this re-renders when the photo is
  // backfilled (CURRENT_USER is a plain getter — it only re-reads
  // on re-render, and this hook is what triggers it).
  const sessionUser = useSessionUser();
  // Live comment count: seeded from the server prop, then kept fresh
  // by the LivePoller (other people's comments tick it up).
  const liveCommentCount = useCommentCount(post.id, post.commentCount);

  const isOwner = sessionUser !== null && sessionUser.id === post.author.id;

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      setDeleted(true);
      toast.success("Post deleted");
    } catch {
      toast("Couldn't delete this post. Try again.");
    }
  };

  // Report beneran ke backend (spec-admin §4.3): form alasan ->
  // POST /api/reports -> notice; Undo menarik laporannya lagi.
  const handleReportSubmit = async (reason: string) => {
    const report = await reportPost(post.id, reason);
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

  const openDetail = () => router.push(`/dashboard/${post.id}`);
  const openDetailAtComment = () =>
    router.push(`/dashboard/${post.id}?focus=comment`);

  if (reportFormOpen) {
    return (
      <article className={CARD_CHROME}>
        <ReportForm
          onCancel={() => setReportFormOpen(false)}
          onSubmit={handleReportSubmit}
        />
      </article>
    );
  }

  if (reported) {
    return (
      <article className={CARD_CHROME}>
        <ReportedPostNotice onUndo={handleUndoReport} />
      </article>
    );
  }

  if (deleted) return null;

  return (
    <article className={`flex flex-col gap-4 ${CARD_CHROME}`}>
      {/* Byline — the author links to their profile */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${post.author.id}`}
          className="group flex items-center gap-2.5"
          aria-label={`View ${post.author.name}'s profile`}
        >
          <Avatar size={36} src={post.author.avatarUrl} alt={post.author.name} />
          <div className="flex flex-col">
            <span className="text-[15px] font-medium group-hover:underline">
              {post.author.name}
            </span>
            <span className="text-xs text-subtle">{post.postedAgo}</span>
          </div>
        </Link>
        <PostOptionsMenu
          {...(isOwner
            ? {
                onEdit: () => setEditOpen(true),
                onDelete: () => setConfirmingDelete(true),
              }
            : { onReport: () => setReportFormOpen(true) })}
        />
      </div>

      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{editedText ?? post.text}</p>

      {/* Photo click -> post detail (replaces the old lightbox) */}
      <PhotoGrid photos={post.photos} onPhotoClick={openDetail} />

      {/* Counters */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-muted">
          <Icon name="show" size={20} />
          <span className="text-xs font-medium">{formatCount(post.views)}</span>
        </span>
        <LikeButton
          storeKey={post.id}
          initialLiked={post.liked}
          initialLikes={post.likes}
        />
        <button
          type="button"
          onClick={openDetailAtComment}
          aria-label={`Comment on post by ${post.author.name}`}
          className="flex cursor-pointer items-center gap-1.5 text-muted transition-colors hover:text-ink"
        >
          <Icon name="message-rounded" size={20} />
          <span className="text-xs font-medium">
            {liveCommentCount > 0 ? formatCount(liveCommentCount) : "Comment"}
          </span>
        </button>
      </div>

      {/* Comment entry — divided from the post, goes to the detail */}
      <div className="h-px w-full bg-placeholder" aria-hidden="true" />
      <div className="flex items-center gap-2.5">
        <Avatar size={28} src={CURRENT_USER.photo} alt={CURRENT_USER.name} />
        <button
          type="button"
          onClick={openDetailAtComment}
          className="flex flex-1 cursor-text items-center justify-between rounded-full bg-bg px-4 py-2 text-left transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <span className="text-sm text-muted">Write your comment</span>
          <Icon name="send" size={18} className="text-muted" />
        </button>
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this post?"
          description="This post will be removed from the feed for everyone. This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirmingDelete(false);
            void handleDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      <PostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={post}
        onUpdated={(text) => setEditedText(text)}
      />
    </article>
  );
}
