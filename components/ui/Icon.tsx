import clsx from "clsx";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size, className }: IconProps) {
  return (
    <i
      aria-hidden="true"
      className={clsx("bx", `bx-${name}`, className)}
      style={size !== undefined ? { fontSize: size } : undefined}
    />
  );
}