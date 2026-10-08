import type { Post } from "../types";
import { Composer } from "./Composer";
import { PostCard } from "./PostCard";
import { Icon } from "@/components/ui/Icon";

export function FeedColumn({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto flex w-full px-12 flex-col gap-6 py-3">
      {/* <Composer /> */}
      {posts.length === 0 ? (
        /* P1-B #16: empty feed state — previously this column rendered
           nothing at all when posts = []. Composer stays commented out
           (separate decision, out of scope). */
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <Icon name="image-add" size={32} className="text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">No posts yet</p>
            <p className="text-sm text-muted">
              Share a project update or a progress photo and it will show up here.
            </p>
          </div>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}