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
import { resolvePersonId } from "@/features/profile/mock";

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [reported, setReported] = useState(false);

  const openDetail = () => router.push(`/dashboard/${post.id}`);
  const openDetailAtComment = () =>
    router.push(`/dashboard/${post.id}?focus=comment`);

  if (reported) {
    return (
      <article className="flex flex-1 flex-col py-3">
        <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
          <Icon name="flag" size={20} className="shrink-0 text-muted" />
          <p className="flex-1 text-sm text-muted">
            <span className="font-medium text-ink">You reported this post.</span>{" "}
            Thanks — our team will review it.
          </p>
          <button
            type="button"
            onClick={() => setReported(false)}
            className="shrink-0 cursor-pointer text-sm font-medium text-ink hover:underline"
          >
            Undo
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-1 flex-col gap-6 py-3">
      {/* Header — author byline links to the author's profile */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${resolvePersonId(post.author.id) ?? post.author.id}`}
          className="group flex items-center gap-2"
          aria-label={`View ${post.author.name}'s profile`}
        >
          <Avatar size={32} src={post.author.avatarUrl} alt={post.author.name} />
          <div className="flex flex-col ">
            <span className="text-base font-medium group-hover:underline">{post.author.name}</span>
            <span className="text-2xs text-subtle">{post.postedAgo}</span>
          </div>
        </Link>
        <PostOptionsMenu onReport={() => setReported(true)} />
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