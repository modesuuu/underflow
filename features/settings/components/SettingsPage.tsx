"use client";

import { ProfileSection } from "./ProfileSection";
import { AppearanceSection } from "./AppearanceSection";
import { HelpSection } from "./HelpSection";
import { AccountSection } from "./AccountSection";

/**
 * The Settings page body: the four sections stacked in one
 * column (Jev's layout pick). Order follows how often each is
 * visited: profile first, account last.
 */
export function SettingsPage() {
  return (
    <div className="flex min-h-full flex-col collab-ground px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-[40px] leading-none font-semibold tracking-tight text-ink uppercase">
            Settings
          </h1>
          <p className="text-sm text-muted">
            Your profile, appearance, help and account in one place.
          </p>
        </header>
        <ProfileSection />
        <AppearanceSection />
        <HelpSection />
        <AccountSection />
      </div>
    </div>
  );
}
