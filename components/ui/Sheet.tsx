import type { ReactNode } from "react";
import clsx from "clsx";

interface SheetProps {
  children: ReactNode;
  /** Deepen the sheet's offset edge. Use on an interactive container, never
   *  on hover-per-card (DESIGN.md bans per-card hover motion). */
  lift?: boolean;
  className?: string;
  as?: "div" | "article" | "section" | "aside";
}

/* The base container of Studio Log: a sheet laid on the ruled pad. Square
   corner, hairline rule, 2px offset edge shadow — never a soft blur. */
export function Sheet({
  children,
  lift = false,
  className,
  as: Tag = "div",
}: SheetProps) {
  return (
    <Tag className={clsx("sheet", lift && "sheet-lift", className)}>
      {children}
    </Tag>
  );
}

interface EntryNumberProps {
  /** The figure to stamp. Rendered in the figures face. */
  value: string | number;
  className?: string;
}

/* The entry number: a stamped figure preceding every repeating item. Real
   sequence (it orders the log), never decoration. */
export function EntryNumber({ value, className }: EntryNumberProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "font-figures text-3xs font-medium tracking-[0.04em] text-subtle",
        className
      )}
    >
      {value}
    </span>
  );
}