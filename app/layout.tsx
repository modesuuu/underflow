import type { Metadata } from "next";
import "boxicons/css/boxicons.min.css";
import { RootShell } from "@/components/layout/RootShell";
import { AppToaster } from "@/components/ui/AppToaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stack Underflow",
  description:
    "Student collaboration hub: find portfolio projects, apply, and build together.",
};

/**
 * Runs before first paint: reads the saved theme mode
 * (localStorage "uf-theme-mode": light | system | dark, default
 * system), resolves it against the OS preference, and stamps
 * data-theme on <html> so the token cascade in tokens.css
 * renders the right palette with no flash of the wrong theme.
 */
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem("uf-theme-mode")||"system";var dark=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink">
        <RootShell>{children}</RootShell>
        <AppToaster />
      </body>
    </html>
  );
}
