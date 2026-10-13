import type { Metadata } from "next";
import "boxicons/css/boxicons.min.css";
import { AppToaster } from "@/components/ui/AppToaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stack Underflow",
  description:
    "Student collaboration hub: find portfolio projects, apply, and build together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh bg-bg font-sans text-ink">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}