import type { Metadata } from "next";
import "boxicons/css/boxicons.min.css";
import { RootShell } from "@/components/layout/RootShell";
import { AppToaster } from "@/components/ui/AppToaster";
import { ThemeInitScript } from "@/components/ui/ThemeInitScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Underflow",
  description:
    "Student collaboration hub: find portfolio projects, apply, and build together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-dvh bg-bg font-sans text-ink">
        {/* Pre-paint theme init, injected into the server stream
            (see components/ui/ThemeInitScript.tsx for why it is
            not a rendered <script> element). */}
        <ThemeInitScript />
        <RootShell>{children}</RootShell>
        <AppToaster />
      </body>
    </html>
  );
}
