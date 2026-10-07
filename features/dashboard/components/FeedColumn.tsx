import type { Post } from "../types";
import { Composer } from "./Composer";
import { PostCard } from "./PostCard";

export function FeedColumn({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
      {/* <Composer /> */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}