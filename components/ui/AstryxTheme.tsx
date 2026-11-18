"use client";

/* Astryx theme provider (redesign/astryx branch): wraps the app in
   Astryx's <Theme> with the built-in Neutral theme and routes
   Astryx links through next/link.
   Mode sync: Astryx colors resolve through CSS light-dark(), which
   follows the color-scheme of the nearest themed ancestor. Our own
   theme toggle stamps data-theme on <html>, so this provider mirrors
   that attribute into Astryx's mode prop (observed live, so the
   toggle keeps driving both systems). The wrapper renders with
   display: contents, so it adds no layout box. */
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

function subscribeMode(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function modeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function modeServerSnapshot(): "light" | "dark" {
  return "light";
}

export function AstryxTheme({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore, not useState with a DOM-reading
  // initializer: the initializer also runs during hydration, where
  // the init script has already stamped the real theme on <html>,
  // so the first client render disagreed with the server's light
  // render and React flagged a hydration mismatch on the Theme
  // div (seen in the console 2026-11-18). The server snapshot
  // keeps hydration identical to the server render; the store
  // then swaps in the real mode and follows the toggle live.
  const mode = useSyncExternalStore(
    subscribeMode,
    modeSnapshot,
    modeServerSnapshot
  );

  return (
    <Theme theme={neutralTheme} mode={mode}>
      <LinkProvider component={Link}>{children}</LinkProvider>
    </Theme>
  );
}
