import type { ReactNode } from "react";
import { Card } from "@astryxdesign/core/Card";

/**
 * One Settings section: an Astryx Card with a title, a one-line
 * description of what the section controls, and the controls
 * themselves. Every section on the page shares this shell so the
 * page reads as one system (Jev chose the stacked-cards layout,
 * 0.96, over a two-pane tab layout).
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
    <Card padding={5}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        {children}
      </div>
    </Card>
  );
}
