"use client";

import { useServerInsertedHTML } from "next/navigation";

/**
 * Runs before first paint: reads the saved theme mode
 * (localStorage "uf-theme-mode": light | system | dark, default
 * system), resolves it against the OS preference, and stamps
 * data-theme on <html> so the token cascade in tokens.css
 * renders the right palette with no flash of the wrong theme.
 *
 * Why useServerInsertedHTML instead of a rendered <Script>:
 * React 19 raises "Encountered a script tag while rendering a
 * React component" for any <script> a component renders, and
 * next/script renders one on the client during hydration.
 * Injecting the tag into the server HTML stream keeps it out
 * of React's tree entirely: the browser parses and runs it
 * from the initial document, React never diffs it, so neither
 * the React warning nor a hydration mismatch can occur (the
 * mismatch was real before: browser extensions rewrite stray
 * head scripts before React loads). The script is idempotent,
 * so a repeated injection would be harmless.
 */
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem("uf-theme-mode")||"system";var dark=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function ThemeInitScript() {
  useServerInsertedHTML(() => (
    <script
      id="uf-theme-init"
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  ));
  return null;
}
