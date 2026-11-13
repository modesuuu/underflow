import type { ReactNode } from "react";

/**
 * One Settings category: a title, a one-line description of
 * what the category controls, and the controls themselves,
 * straight on the page's white ground — no card shell (the
 * user's call); the hairline dividers inside each category
 * carry the separation. Each category renders this shell on
 * its own sub-page (hub-and-spoke), so every detail page
 * reads the same way.
 */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
