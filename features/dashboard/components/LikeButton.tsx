"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { formatCount } from "@/lib/format";
import { useLikeState } from "../like-store";
import { likeComment, likePost, unlikeComment, unlikePost } from "../api";

interface LikeButtonProps {
  storeKey: string;
  initialLiked: boolean;
  initialLikes: number;
  /** "sm" = the compact, muted variant for secondary content (comments). */
  size?: "md" | "sm";
}

/**
 * One like button, one store — feed and post detail share the same entity
 * entry, so a like toggled on either surface reads back on both. The pop
 * (WAAPI spring overshoot on LIKE only) runs on the same wrapped span as
 * before; unlike animates nothing.
 */
export function LikeButton({
  storeKey,
  initialLiked,
  initialLikes,
  size = "md",
}: LikeButtonProps) {
  const bumpRef = useRef<HTMLSpanElement>(null);
  const [busy, setBusy] = useState(false);
  const [{ liked, likes }, toggle] = useLikeState(
    storeKey,
    initialLiked,
    initialLikes
  );

  // Post likes (storeKey = the raw post id) and comment likes
  // (storeKey = `comment:<id>`) both persist to the backend now.
  const isPostLike = !storeKey.startsWith("comment:");
  const commentId = isPostLike ? null : storeKey.slice("comment:".length);

  const handleClick = async () => {
    if (busy) return;
    if (!liked && bumpRef.current) {
      bumpRef.current.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.45)", offset: 0.4 },
          { transform: "scale(0.92)", offset: 0.7 },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
      );
    }
    // Optimistic toggle first (heart pop + count), then sync to the
    // backend; on failure revert the toggle so the UI never lies.
    toggle();
    setBusy(true);
    try {
      if (isPostLike) {
        if (!liked) await likePost(storeKey);
        else await unlikePost(storeKey);
      } else if (commentId) {
        if (!liked) await likeComment(commentId);
        else await unlikeComment(commentId);
      }
    } catch {
      toggle();
      toast("Couldn't save your like. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const sm = size === "sm";
  const idle = sm
    ? "text-muted transition-colors group-hover:text-ink"
    : "text-ink";
  return (
    <button
      type="button"
      aria-pressed={liked}
      disabled={busy}
      onClick={handleClick}
      className={
        sm
          ? "group flex cursor-pointer items-center gap-1.5"
          : "flex cursor-pointer items-center gap-1"
      }
    >
      <span ref={bumpRef} className="inline-flex">
        <HeartIcon
          filled={liked}
          size={sm ? 18 : 24}
          className={liked ? "text-heart" : idle}
        />
      </span>
      <span
        className={clsx(
          sm ? "text-xs font-medium" : "text-2xs font-medium",
          liked ? "text-heart" : idle
        )}
      >
        {formatCount(likes)}
      </span>
    </button>
  );
}
