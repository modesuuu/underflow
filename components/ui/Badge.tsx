import clsx from "clsx";

interface BadgeProps {
  count: number;
  tone?: "danger" | "accent";
  shape?: "square" | "pill";
  className?: string;
}

/* A count badge is a stamped figure: mono, tight, with the margin red for
   attention. It never becomes a decorative dot. */
export function Badge({
  count,
  tone = "danger",
  shape = "square",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "font-figures inline-flex min-w-4 items-center justify-center px-1 text-3xs font-medium leading-4",
        shape === "pill" ? "rounded-pill" : "rounded-[2px]",
        tone === "danger" ? "bg-badge text-surface" : "bg-accent text-surface",
        className
      )}
    >
      {count}
    </span>
  );
}