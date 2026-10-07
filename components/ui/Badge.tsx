import clsx from "clsx";

interface BadgeProps {
  count: number;
  tone?: "danger" | "accent";
  shape?: "square" | "pill";
  className?: string;
}

export function Badge({
  count,
  tone = "danger",
  shape = "square",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex min-w-4 items-center justify-center px-1 text-xs font-medium leading-4",
        shape === "pill" ? "rounded-pill text-2xs" : "rounded-[2px]",
        tone === "danger" ? "bg-badge text-surface" : "bg-accent text-ink",
        className
      )}
    >
      {count}
    </span>
  );
}