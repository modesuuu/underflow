"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import type { Post } from "../types";
import { LikeButton } from "./LikeButton";
import { LikeHydrator } from "./LikeHydrator";
import { PhotoViewer } from "./PhotoViewer";
import { PostOptionsMenu } from "./PostOptionsMenu";
import { ReportedPostNotice } from "./ReportedPostNotice";
import { ReportForm } from "./ReportForm";
import { recordView, reportPost, withdrawReport } from "../api";

/**
 * The post itself on the detail page — deliberately the feed
 * card's twin: same byline (36px avatar, 15px name, 12px time),
 * same Book body at 15px relaxed, same quiet counters, and the
 * same ••• menu, whose Report swaps the post for the shared
 * reported notice (closing the old P1-C #18 gap — the menu
 * exists now, so the detail gets it too). Photos keep the
 * detail's own viewer (the feed grid + lightbox). The Comment
 * counter focuses the comment input below, keeping the promise
 * the feed's comment entry makes.
 */
export function PostDetailBody({ post }: { post: Post }) {
  const [reported, setReported] = useState(false);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportedId, setReportedId] = useState<string | null>(null);
  const [views, setViews] = useState(post.views);
  const recordedRef = useRef(false);

  // One view per open: the eye icon only moves when the detail is
  // actually opened. A failed record is silent — it must never break
  // the page, and the feed count is the source of truth anyway.
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordView(post.id)
      .then(({ viewCount }) => setViews(viewCount))
      .catch(() => {});
  }, [post.id]);

  // Report beneran ke backend (spec-admin §4.3), sama seperti feed.
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

  if (reportFormOpen) {
    return (
      <ReportForm
        onCancel={() => setReportFormOpen(false)}
        onSubmit={handleReportSubmit}
      />
    );
  }

  if (reported) {
    return <ReportedPostNotice onUndo={handleUndoReport} />;
  }

  const focusComment = () => {
    const el = document.getElementById("uf-comment-input");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <LikeHydrator />
      {/* Byline — identical to the feed card's */}
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
        <PostOptionsMenu onReport={() => setReportFormOpen(true)} />
      </div>

      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</p>

      <PhotoViewer photos={post.photos} />

      {/* Counters — the feed's quiet row */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-muted">
          <Icon name="show" size={20} />
          <span className="text-xs font-medium">{formatCount(views)}</span>
        </span>
        <LikeButton
          storeKey={post.id}
          initialLiked={post.liked}
          initialLikes={post.likes}
        />
        <button
          type="button"
          onClick={focusComment}
          aria-label="Comment on this post"
          className="flex cursor-pointer items-center gap-1.5 text-muted transition-colors hover:text-ink"
        >
          <Icon name="message-rounded" size={20} />
          <span className="text-xs font-medium">Comment</span>
        </button>
      </div>
    </div>
  );
}
