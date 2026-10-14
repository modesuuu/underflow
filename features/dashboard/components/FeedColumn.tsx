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
    <div className="ml-[28px] flex w-full max-w-(--uf-content-w) flex-col gap-5 py-3">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <Icon name="message-rounded" size={32} className="text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">Nothing here yet</p>
            <p className="text-sm text-muted">
              Updates from people in your projects will show up here.
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
