"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/components/layout/nav";
import type { PostComment } from "../types";
import { CommentThread } from "./CommentThread";
import { getComments, postComment } from "../api";
import { isApiConfigured } from "@/lib/api-client";

interface CommentSectionProps {
  postId: string;
  initialComments: PostComment[];
  autoFocusComment?: boolean;
}


export function CommentSection({ postId, initialComments, autoFocusComment = false }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Comments are auth-gated (GET /api/posts/:id/comments needs a token),
  // so they load client-side here — the detail page is a server component
  // and cannot send the Bearer token. A 401/403 (guest) just leaves the
  // initial list; other failures show a retry.
  useEffect(() => {
    if (!isApiConfigured()) return;
    let cancelled = false;
    getComments(postId)
      .then((list) => {
        if (!cancelled) setComments(list);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status !== 401 && status !== 403) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);
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

  const submit = async () => {
    const text = draft.trim();
    if (!text) {
      toast("Write a comment first");
      return;
    }
    const tempId = `local-${Date.now()}`;
    // Optimistic row first, then the real comment from the backend
    // replaces it; on failure the row is removed so the UI never lies.
    setComments((prev) => [
      ...prev,
      {
        id: tempId,
        author: { id: "me", name: CURRENT_USER.name },
        text,
        postedAgo: "Just now",
        likes: 0,
        liked: false,
      },
    ]);
    setDraft("");
    setLastAddedId(tempId);
    try {
      const saved = await postComment(postId, text);
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? saved : c))
      );
      setLastAddedId(saved.id);
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setLastAddedId(null);
      toast("Couldn't post your comment. Try again.");
    }
  };


  useEffect(() => {
    if (!lastAddedId || !newCommentRef.current) return;
    newCommentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lastAddedId]);

  return (
    <>
      {/* Comment input bar */}
      <div className="flex items-center gap-3">
        <Avatar size={28} alt={CURRENT_USER.name} />
        <div ref={inputBarRef} className="flex flex-1 items-center justify-between rounded-full bg-bg py-2 pr-2 pl-4 transition-shadow focus-within:ring-2 focus-within:ring-accent">
          <input
            id="uf-comment-input"
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
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            aria-label="Send comment"
            onClick={submit}
            disabled={!draft.trim()}
            className={`flex shrink-0 cursor-pointer items-center transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${
              draft.trim() ? "text-ink" : "text-muted"
            }`}
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>

      {/* Comments */}
      {loadError && (
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            getComments(postId)
              .then((list) => setComments(list))
              .catch(() => setLoadError(true));
          }}
          className="cursor-pointer text-sm text-muted underline hover:text-ink"
        >
          Couldn't load comments. Tap to retry.
        </button>
      )}
      <CommentThread
        comments={comments}
        newCommentId={lastAddedId}
        newCommentRef={newCommentRef}
      />
    </>
  );
}