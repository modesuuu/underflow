"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/components/layout/nav";
import type { Post } from "../types";
import { Composer } from "./Composer";
import { PostCard } from "./PostCard";

/**
 * The feed river. Server posts arrive as props; the composer
 * prepends locally for the session (the store reconciliation is
 * a backend TODO, see Composer). Entrance: the codebase's
 * card-stagger cascade (uf-card-in, --stagger-i), capped so the
 * tail lands inside the motion budget.
 */
const STAGGER_CAP = 8;

export function FeedColumn({ posts }: { posts: Post[] }) {
  const [items, setItems] = useState<Post[]>(posts);
  const seq = useRef(0);

  const handlePost = (text: string) => {
    seq.current += 1;
    const post: Post = {
      id: `local-${seq.current}`,
      author: { id: "me", name: CURRENT_USER.name },
      postedAgo: "Just now",
      text,
      photos: [],
      views: 0,
      likes: 0,
      liked: false,
      comments: [],
    };
    setItems((prev) => [post, ...prev]);
    toast.success("Update posted", {
      description: "It is at the top of your feed for this session.",
    });
  };

  return (
    <div className="ml-[28px] flex w-full max-w-(--uf-content-w) flex-col gap-4 py-3">
      <Composer onPost={handlePost} />
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <Icon name="message-rounded" size={32} className="text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">Nothing here yet</p>
            <p className="text-sm text-muted">
              Updates from people in your projects will show up here. Post
              the first one above.
            </p>
          </div>
        </div>
      ) : (
        items.map((post, i) => (
          <div
            key={post.id}
            className="card-stagger"
            style={
              { "--stagger-i": String(Math.min(i, STAGGER_CAP)) } as React.CSSProperties
            }
          >
            <PostCard post={post} />
          </div>
        ))
      )}
    </div>
  );
}
