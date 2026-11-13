import type { ReactNode } from "react";
import { Card } from "@astryxdesign/core/Card";

/**
 * One Settings category: an Astryx Card with a title, a one-line
 * description of what the category controls, and the controls
 * themselves. Each category renders this shell on its own
 * sub-page (hub-and-spoke, the user's structure call), so every
 * detail page reads the same way.
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
