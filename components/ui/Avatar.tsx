"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  rounded?: "full" | "md" | "sm";
  className?: string;
  /** Override the fallback background color when src is missing. */
  placeholderBg?: string;
}

const ROUNDED_CLASS = {
  full: "rounded-full",
  md: "rounded-md",
  sm: "rounded-sm",
} as const;

/** First initials of the name, e.g. "Russel" -> "R", "Kimi N." -> "KN". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  src,
  alt,
  size = 42,
  rounded = "full",
  className,
  placeholderBg,
}: AvatarProps) {
  const shape = ROUNDED_CLASS[rounded];
  // next/image shows a broken-image glyph on 404; fall back to a
  // placeholder circle with initials instead.
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    const showInitials = errored && src ? initialsOf(alt) : "";
    return (
      <div
        role="img"
        aria-label={alt}
        className={clsx(
          "flex shrink-0 items-center justify-center",
          placeholderBg ? "font-semibold text-bg" : "bg-placeholder",
          shape,
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: showInitials ? Math.round(size * 0.42) : undefined,
          ...(placeholderBg ? { backgroundColor: placeholderBg } : {}),
        }}
      >
        {showInitials || null}
      </div>
    );
  }

  return (
    <div
      className={clsx("relative shrink-0 overflow-hidden", shape, className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}