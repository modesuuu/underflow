"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import type { Post } from "../types";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { LikeButton } from "./LikeButton";
import { PostOptionsMenu } from "./PostOptionsMenu";
import { ReportedPostNotice } from "./ReportedPostNotice";
import { resolvePersonId } from "@/features/profile/mock";

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

  const openDetail = () => router.push(`/dashboard/${post.id}`);
  const openDetailAtComment = () =>
    router.push(`/dashboard/${post.id}?focus=comment`);

  if (reported) {
    return (
      <article className={CARD_CHROME}>
        <ReportedPostNotice onUndo={() => setReported(false)} />
      </article>
    );
  }

  return (
    <article className={`flex flex-col gap-4 ${CARD_CHROME}`}>
      {/* Byline — the author links to their profile */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${resolvePersonId(post.author.id) ?? post.author.id}`}
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
        <PostOptionsMenu onReport={() => setReported(true)} />
      </div>

      {/* Body — user text reads in Book, not Medium */}
      <p className="text-[15px] leading-relaxed">{post.text}</p>

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
          <span className="text-xs font-medium">Comment</span>
        </button>
      </div>

      {/* Comment entry — divided from the post, goes to the detail */}
      <div className="h-px w-full bg-placeholder" aria-hidden="true" />
      <div className="flex items-center gap-2.5">
        <Avatar size={28} alt="You" />
        <button
          type="button"
          onClick={openDetailAtComment}
          className="flex flex-1 cursor-text items-center justify-between rounded-full bg-bg px-4 py-2 text-left transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <span className="text-sm text-muted">Write your comment</span>
          <Icon name="send" size={18} className="text-muted" />
        </button>
      </div>
    </article>
  );
}
