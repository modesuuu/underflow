interface HeartIconProps {
  filled: boolean;
  size?: number;
  className?: string;
}

/**
 * Inline SVG heart — the like glyph. Boxicons' `bxs-heart` font glyph does
 * not render in every environment (the icon disappeared on like), so the
 * filled state is an SVG fill instead of a font swap. Outline/filled differ
 * only by `fill`, so the two states cannot diverge in shape.
 */
export function HeartIcon({ filled, size = 24, className }: HeartIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
