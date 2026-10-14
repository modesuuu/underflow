"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type ThemeMode = "light" | "system" | "dark";

const STORAGE_KEY = "uf-theme-mode";

const MODES: { id: ThemeMode; label: string; icon: string }[] = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "system", label: "System", icon: "desktop" },
  { id: "dark", label: "Dark", icon: "moon" },
];

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function applyMode(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", resolveMode(mode));
}

/**
 * Theme switch — Light / System / Dark. The mode persists in
 * localStorage ("uf-theme-mode"); the resolved palette is the
 * data-theme attribute on <html>, which the token cascade in
 * tokens.css keys off. The pre-paint script in the root layout
 * applies the same resolution before hydration, so there is no
 * flash; this control owns changes after mount, including
 * following live OS changes while in System mode.
 *
 * variant "full" = segmented control (expanded sidebar);
 * variant "rail" = one icon button cycling the modes
 * (collapsed sidebar), its icon showing the current mode.
 */
export function ThemeToggle({
  variant = "full",
}: {
  variant?: "full" | "rail";
}) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setMode(stored);
    }
    setMounted(true);
  }, []);

  // In System mode the palette follows the OS live.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const choose = (next: ThemeMode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  };

  if (variant === "rail") {
    const index = MODES.findIndex((m) => m.id === mode);
    const current = MODES[index] ?? MODES[1];
    const next = MODES[(index + 1) % MODES.length];
    return (
      <button
        type="button"
        onClick={() => choose(next.id)}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        className="nav-row-hoverable flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name={mounted ? current.icon : "desktop"} size={20} />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-placeholder/50 p-1"
      role="group"
      aria-label="Theme"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => choose(m.id)}
          aria-pressed={mode === m.id}
          aria-label={`${m.label} theme`}
          className={
            mode === m.id
              ? "flex size-7 cursor-pointer items-center justify-center rounded-full bg-ink text-surface shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              : "flex size-7 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          }
        >
          <Icon name={m.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
