import type { Metadata } from "next";
import "boxicons/css/boxicons.min.css";
import { RootShell } from "@/components/layout/RootShell";
import { AppToaster } from "@/components/ui/AppToaster";
import { ThemeInitScript } from "@/components/ui/ThemeInitScript";
import { AstryxTheme } from "@/components/ui/AstryxTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Underflow",
  description:
    "Student collaboration hub: find portfolio projects, apply, and build together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Figtree, the Astryx Neutral typeface (weights 400-700). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink">
        {/* Pre-paint theme init, injected into the server stream
            (see components/ui/ThemeInitScript.tsx for why it is
            not a rendered <script> element). */}
        <ThemeInitScript />
        <AstryxTheme>
          <RootShell>{children}</RootShell>
          <AppToaster />
        </AstryxTheme>
      </body>
    </html>
  );
}
