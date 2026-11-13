"use client";

import Link from "next/link";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@/components/ui/Icon";

interface SettingsCategory {
  href: string;
  icon: string;
  label: string;
  description: string;
}

const CATEGORIES: SettingsCategory[] = [
  {
    href: "/settings/profile",
    icon: "user",
    label: "Profile",
    description: "Your photo and skills",
  },
  {
    href: "/settings/appearance",
    icon: "palette",
    label: "Appearance",
    description: "Theme for this device",
  },
  {
    href: "/settings/help",
    icon: "help-circle",
    label: "Help Center",
    description: "How Underflow works",
  },
  {
    href: "/settings/account",
    icon: "lock-alt",
    label: "Account",
    description: "Sign-in method and log out",
  },
];

/**
 * The Settings home: one row per category, hub-and-spoke (the
 * user's structure call, 2026-11-13). Each category owns a
 * sub-page, so Settings can grow a category at a time — password
 * and notification preferences are already queued behind
 * backend work — instead of one page scrolling forever.
 */
export function SettingsIndex() {
  return (
    <div className="flex min-h-full flex-col gap-4 collab-ground px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-[40px] leading-none font-semibold tracking-tight text-ink uppercase">
          Settings
        </h1>
        <p className="text-sm text-muted">
          Pick a category to manage it.
        </p>
      </header>
      <Card padding={0}>
        <div className="flex flex-col">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={
                "pressable flex items-center gap-3 px-5 py-4 transition-colors hover:bg-bg " +
                (i > 0 ? "border-t border-line" : "")
              }
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-ink">
                <Icon name={cat.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-ink">{cat.label}</span>
                <span className="truncate text-sm text-muted">
                  {cat.description}
                </span>
              </span>
              <span className="text-muted">
                <Icon name="chevron-right" size={20} />
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
