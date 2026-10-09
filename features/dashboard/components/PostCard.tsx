"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import type { Post } from "../types";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { LikeButton } from "./LikeButton";

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  const openDetail = () => router.push(`/dashboard/${post.id}`);
  const openDetailAtComment = () =>
    router.push(`/dashboard/${post.id}?focus=comment`);

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
              <Icon name="show" size={24} className="text-ink" />
              <span className="text-2xs font-medium">
                {formatCount(post.views)}
              </span>
            </span>
            <LikeButton
              storeKey={post.id}
              initialLiked={post.liked}
              initialLikes={post.likes}
            />
            {/* Comment counter -> post detail at the composer (same target
                as the "Write your comment" bar below). The thread itself
                lives on the detail page; the feed does not inline it. */}
            <button
              type="button"
              onClick={openDetailAtComment}
              aria-label={`Comment on post by ${post.author.name}`}
              className="flex cursor-pointer items-center gap-1"
            >
              <Icon name="message-rounded" size={24} className="text-ink" />
              <span className="text-2xs font-medium text-ink">Comment</span>
            </button>
          </div>
        </div>
      </div>

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