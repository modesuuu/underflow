"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { EntryNumber } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import type { Post } from "../types";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { LikeButton } from "./LikeButton";

/* A feed post is a log ENTRY: a sheet laid on the ruled pad, stamped with its
   entry number, its author line, the body, the prints, then the counters as
   a marginal annotation row. */
export function PostCard({ post, index }: { post: Post; index?: number }) {
  const router = useRouter();

  const openDetail = () => router.push(`/dashboard/${post.id}`);
  const openDetailAtComment = () =>
    router.push(`/dashboard/${post.id}?focus=comment`);

  return (
    <article className="sheet page-enter flex flex-col gap-5 p-6">
      {/* Stamp + author */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            size={36}
            src={post.author.avatarUrl}
            alt={post.author.name}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">
              {post.author.name}
            </span>
            <span className="font-figures text-2xs text-subtle">
              {post.postedAgo}
            </span>
          </div>
        </div>
        {index !== undefined && (
          <EntryNumber value={`#${String(index + 1).padStart(3, "0")}`} />
        )}
      </div>

      {/* Body */}
      <p className="text-base leading-relaxed text-ink">{post.text}</p>

      {/* Prints */}
      <PhotoGrid photos={post.photos} onPhotoClick={openDetail} />

      {/* Counters: a marginal annotation row, hairline-separated. */}
      <div className="flex items-center gap-5 border-t border-rule pt-4">
        <span className="flex items-center gap-1.5">
          <Icon name="show" size={22} className="text-muted" />
          <span className="font-figures text-2xs font-medium text-muted">
            {formatCount(post.views)}
          </span>
        </span>
        <LikeButton
          storeKey={post.id}
          initialLiked={post.liked}
          initialLikes={post.likes}
        />
        {/* The thread lives on the detail page; the feed never inlines it. */}
        <button
          type="button"
          onClick={openDetailAtComment}
          aria-label={`Comment on post by ${post.author.name}`}
          className="pressable flex cursor-pointer items-center gap-1.5 rounded-sm"
        >
          <Icon name="message-rounded" size={22} className="text-muted" />
          <span className="text-2xs font-medium text-muted">Comment</span>
        </button>
      </div>

      {/* The composer is a ruled input line, not a bordered button. */}
      <button
        type="button"
        onClick={openDetailAtComment}
        className="flex cursor-text items-center gap-3 border-t border-rule pt-4 text-left"
      >
        <Avatar size={32} alt="You" />
        <span className="flex flex-1 items-baseline justify-between border-b border-rule pb-1">
          <span className="text-sm text-muted">Write your comment</span>
          <Icon name="send" size={20} className="text-ink" />
        </span>
      </button>
    </article>
  );
}