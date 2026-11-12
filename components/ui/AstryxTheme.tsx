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
import { useEffect, useState } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

function currentMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function AstryxTheme({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">(currentMode);

  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setMode(currentMode());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Theme theme={neutralTheme} mode={mode}>
      <LinkProvider component={Link}>{children}</LinkProvider>
    </Theme>
  );
}
