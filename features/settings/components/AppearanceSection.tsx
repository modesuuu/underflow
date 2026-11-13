"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SettingsSection } from "./SettingsSection";

/**
 * Appearance section: the same theme control the sidebar footer
 * carries (Light / System / Dark, persisted per device in
 * localStorage), presented as a settings row. One mechanism, two
 * homes — changing it here updates the sidebar control and the
 * whole app immediately.
 */
export function AppearanceSection() {
  return (
    <SettingsSection
      title="Appearance"
      description="Choose how Underflow looks on this device. System follows your device setting."
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-ink">Theme</span>
        <ThemeToggle variant="full" />
      </div>
    </SettingsSection>
  );
}
