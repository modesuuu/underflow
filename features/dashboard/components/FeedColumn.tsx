import type { Post } from "../types";
import { PostCard } from "./PostCard";
import { Icon } from "@/components/ui/Icon";

export function FeedColumn({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 py-6">
      {posts.length === 0 ? (
        /* Empty state: ruled sheet, an invitation to act (PRODUCT.md
           principle 3) — never a mood. */
        <div className="sheet flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Icon name="image-add" size={30} className="text-subtle" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-ink">No posts yet</p>
            <p className="text-sm text-muted">
              Share a project update or a progress photo and it will show up
              here.
            </p>
          </div>
        </div>
      ) : (
        posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))
      )}
    </div>
  );
}