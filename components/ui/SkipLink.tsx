/**
 * Skip-to-content link (audit P2 #23): visually hidden until
 * it receives keyboard focus, then it appears at the top
 * corner. Targets the #main-content landmark that AppShell
 * and AdminShell put on their <main> elements.
 */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent"
    >
      {label}
    </a>
  );
}
