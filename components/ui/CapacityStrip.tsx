"use client";

import clsx from "clsx";

interface CapacityStripProps {
  filled: number;
  total: number;
  /** Show the numeric readout beside the ticks. Default true. */
  showCount?: boolean;
  className?: string;
}

/**
 * The signature move of Studio Log: a project's slot budget drawn as ruled
 * tick boxes on the pad, with the count stamped in the highlighter mark.
 * Capacity is a first-class number everywhere a project appears
 * (PRODUCT.md principle 1) — this is the one place the world's mark colour
 * is allowed to carry a figure.
 *
 * Invariant: `filled` is clamped to `[0, total]`, so the strip can never
 * draw more ticks than the budget (main's makeSlots invariant).
 */
export function CapacityStrip({
  filled,
  total,
  showCount = true,
  className,
}: CapacityStripProps) {
  const safeTotal = Math.max(0, total);
  const safeFilled = Math.min(Math.max(0, filled), safeTotal);

  return (
    <span
      className={clsx("inline-flex items-center gap-2", className)}
      aria-label={`${safeFilled} of ${safeTotal} slots filled`}
    >
      <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: safeTotal }).map((_, i) => (
          <span
            key={i}
            className={clsx(
              "h-[10px] w-[6px] rounded-[1px] border",
              i < safeFilled
                ? "tick-fill border-ink bg-ink"
                : "border-line bg-transparent"
            )}
            style={{ ["--tick-i" as string]: i }}
          />
        ))}
      </span>
      {showCount && (
        <span className="font-figures text-2xs font-medium text-ink">
          <span className="bg-mark px-1">{safeFilled}</span>
          <span className="text-subtle">/{safeTotal}</span>
        </span>
      )}
    </span>
  );
}