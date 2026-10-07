import clsx from "clsx";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  rounded?: "full" | "md" | "sm";
  className?: string;
}

const ROUNDED_CLASS = {
  full: "rounded-full",
  md: "rounded-md",
  sm: "rounded-sm",
} as const;

export function Avatar({
  src,
  alt,
  size = 42,
  rounded = "full",
  className,
}: AvatarProps) {
  const shape = ROUNDED_CLASS[rounded];

  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={clsx("shrink-0 bg-placeholder", shape, className)}
        style={{ width: size, height: size }}
      />
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
      />
    </div>
  );
}