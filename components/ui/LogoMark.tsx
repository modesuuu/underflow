/**
 * The Underflow mark — A2 "Star Join", the Joining U revision the user
 * picked for revision (Muse's recommendation; the A2 app icon was verified
 * as a cream U + lime star on #191A19). The U strokes in currentColor so it
 * follows the surrounding ink in both themes; the star takes the accent
 * (or a `starClassName` override, e.g. the lime star on the dark brand
 * panel). If the user picks A3 "Solid U" instead, swap these two paths for
 * concept-a3-symbol.svg — one file, one change.
 */
export function LogoMark({
  className,
  starClassName = "fill-accent",
}: {
  className?: string;
  starClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      role="img"
      aria-label="Underflow logo"
    >
      <path
        d="M64,56 V140 A64,64 0 0 0 192,140 V104"
        fill="none"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
      />
      <path
        d="M192,14 L198.5,39.5 L216,46 L198.5,52.5 L192,80 L185.5,52.5 L168,46 L185.5,39.5 Z"
        className={starClassName}
      />
    </svg>
  );
}
