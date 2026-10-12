import clsx from "clsx";

interface CapacityStripProps {
  filled: number;
  total: number;
  className?: string;
}

/**
 * Capacity as a tick strip (B1 pattern) in the A palette: one tick per slot,
 * filled ticks solid ink, empty ticks hairline outlines; the filled/total
 * figure is mono with the filled count marked in the accent. Used on
 * collaboration cards and project detail.
 */
export function CapacityStrip({ filled, total, className }: CapacityStripProps) {
  const safeTotal = Math.max(total, 0);
  const ticks = Array.from({ length: safeTotal });

  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <div className="flex gap-0.5" aria-hidden>
        {ticks.map((_, i) => (
          <span
            key={i}
            className={clsx(
              "h-3.5 w-1 rounded-[1px] border",
              i < filled ? "border-ink bg-ink" : "border-line bg-transparent"
            )}
          />
        ))}
      </div>
      <span className="font-figures text-2xs leading-none text-subtle tabular-nums">
        <mark className="rounded-[2px] bg-accent px-0.5 text-ink">
          {filled}
        </mark>{" "}
        / {total} slots
      </span>
    </div>
  );
}
