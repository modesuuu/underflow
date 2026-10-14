"use client";

import { useRef } from "react";
import clsx from "clsx";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { formatCount } from "@/lib/format";
import { useLikeState } from "../like-store";

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
  const [{ liked, likes }, toggle] = useLikeState(
    storeKey,
    initialLiked,
    initialLikes
  );

  const handleClick = () => {
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
    toggle();
  };

  const sm = size === "sm";
  const idle = sm
    ? "text-muted transition-colors group-hover:text-ink"
    : "text-ink";
  return (
    <button
      type="button"
      aria-pressed={liked}
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
