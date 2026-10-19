import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Post } from "../types";
import { PostCard } from "./PostCard";

/**
 * The feed river: flat posts separated by rhythm, not boxes —
 * the page background is the surface. Entrance is the
 * codebase's card-stagger cascade (uf-card-in, --stagger-i),
 * capped so the tail lands inside the motion budget. Posting
 * lives in the TopBar's Post button; there is no composer here.
 */
const STAGGER_CAP = 8;

export function FeedColumn({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-3 lg:mx-0 lg:ml-[28px] lg:px-0">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <Icon name="message-rounded" size={32} className="text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">No posts yet</p>
            <p className="text-sm text-muted">
              Updates from people in your projects appear here.
            </p>
          </div>
        </div>
      ) : (
        posts.map((post, i) => (
          <div
            key={post.id}
            className="card-stagger"
            style={
              { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as CSSProperties
            }
          >
            <PostCard post={post} />
          </div>
        ))
      )}
    </div>
  );
}
