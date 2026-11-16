import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/LogoMark";
import { SkipLink } from "@/components/ui/SkipLink";

/**
 * Frame for the public legal/info pages (Terms, Privacy,
 * About, Contact). Plain document layout on purpose: these
 * pages are read, not operated, and they must render the
 * same signed in or out (RootShell treats them as bare
 * routes). Content is English, matching the product UI's
 * default language.
 */
const NAV = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <SkipLink label="Skip to main content" />
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LogoMark className="h-6 w-6" />
            Underflow
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {updated ? (
          <p className="mt-2 text-sm text-subtle">Last updated: {updated}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-sm text-subtle">
          <span>© 2026 Underflow</span>
          <nav className="flex items-center gap-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">{heading}</h2>
      <div className="mt-2 flex flex-col gap-3 text-[15px] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
