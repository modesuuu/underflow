/**
 * The Underflow mark — the user's own solid U (joining-u-vector.svg),
 * verified against the PNG he sent 2026-11-06: same 188x185 bounds,
 * same two filled paths. Filled currentColor so it follows the
 * surrounding ink in both themes and on the forest brand panel.
 * The A2 "Star Join" (stroked U + lime star) was the wrong mark and is
 * retired; the A3 "Solid U" finalist is retired too — this is the mark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 213 209"
      className={className}
      role="img"
      aria-label="Underflow logo"
    >
      <path
        d="M0 0 C20.46 0 40.92 0 62 0 C62 40.26 62 80.52 62 122 C43.54 122 29.98 115.93 17 103 C16.36 102.39 15.72 101.77 15.07 101.14 C2.43 88 -0.48 71.11 -0.29 53.61 C-0.29 52.06 -0.28 50.51 -0.28 48.95 C-0.27 44.9 -0.24 40.85 -0.21 36.8 C-0.17 31.91 -0.16 27.03 -0.14 22.15 C-0.11 14.77 -0.05 7.38 0 0 Z"
        fill="currentColor"
        transform="translate(13,12)"
      />
      <path
        d="M0 0 C20.46 0 40.92 0 62 0 C62.16 17.67 62.16 17.67 62.2 25.33 C62.22 30.51 62.25 35.69 62.3 40.88 C62.68 77.85 62.68 77.85 58 94 C57.86 94.5 57.86 94.5 57.16 97.02 C56.46 99.32 55.69 101.52 54.81 103.75 C54.52 104.52 54.22 105.29 53.92 106.08 C41.67 136.97 17.41 161.7 -12.91 175.12 C-22.46 179.14 -32.17 182.1 -42.38 183.88 C-43.06 184 -43.75 184.12 -44.46 184.24 C-50.79 185.21 -56.4 185 -63 185 C-63 164.54 -63 144.08 -63 123 C-60.19 122.5 -60.19 122.5 -46 120 C-27.37 113.42 -14.59 102.78 -6 85 C-2.69 76.77 -0.91 69.05 -0.79 60.17 C-0.78 59.51 -0.77 58.86 -0.76 58.19 C-0.73 56.04 -0.71 53.9 -0.68 51.76 C-0.66 50.26 -0.64 48.77 -0.62 47.28 C-0.57 43.36 -0.52 39.45 -0.47 35.53 C-0.41 30.82 -0.34 26.12 -0.28 21.41 C-0.18 14.27 -0.09 7.14 0 0 Z"
        fill="currentColor"
        transform="translate(139,12)"
      />
    </svg>
  );
}
