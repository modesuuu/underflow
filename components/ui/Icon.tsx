import clsx from "clsx";

interface IconProps {
  name: string;
  size?: number;
  /** Render the solid/filled Boxicons glyph (bxs- prefix) instead of regular (bx-). */
  solid?: boolean;
  className?: string;
}

export function Icon({ name, size, solid = false, className }: IconProps) {
  const prefix = solid ? "bxs" : "bx";
  return (
    <i
      aria-hidden="true"
      className={clsx(prefix, `${prefix}-${name}`, className)}
      style={size !== undefined ? { fontSize: size } : undefined}
    />
  );
}
