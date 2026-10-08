"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/components/layout/nav";
import type { PostComment } from "../types";
import { CommentThread } from "./CommentThread";

interface CommentSectionProps {
  initialComments: PostComment[];
  autoFocusComment?: boolean;
}


export function CommentSection({ initialComments, autoFocusComment = false }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const newCommentRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Arriving from a feed comment click (?focus=comment): bring the input
  // into view and focus it so the user can type immediately.
  useEffect(() => {
    if (!autoFocusComment) return;
    inputBarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus({ preventScroll: true });
  }, [autoFocusComment]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    const id = `local-${Date.now()}`;
    // TODO(backend): POST /api/posts/:id/comments
    setComments((prev) => [
      ...prev,
      {
        id,
        author: { id: "me", name: CURRENT_USER.name },
        text,
        postedAgo: "Just now",
        likes: 0,
        liked: false,
      },
    ]);
    setDraft("");
    setLastAddedId(id);
  };


  useEffect(() => {
    if (!lastAddedId || !newCommentRef.current) return;
    newCommentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lastAddedId]);

  return (
    <>
      {/* Comment input bar */}
      <div className="flex items-center gap-3">
        <Avatar size={32} alt={CURRENT_USER.name} />
        <div ref={inputBarRef} className="flex flex-1 items-center justify-between rounded-lg border border-accent bg-surface p-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Write your comment"
            // P1-C #20: the input had no accessible name beyond the
            // placeholder (placeholders disappear on focus) — add one.
            aria-label="Write your comment"
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            aria-label="Send comment"
            onClick={submit}
            className="shrink-0 cursor-pointer text-accent flex items-center"
          >
            <Icon name="send" size={24} />
          </button>
        </div>
      </div>

      {/* Comments */}
      <CommentThread
        comments={comments}
        newCommentId={lastAddedId}
        newCommentRef={newCommentRef}
      />
    </>
  );
}