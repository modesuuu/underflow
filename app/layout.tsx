import type { Metadata } from "next";
import { Archivo, Spline_Sans_Mono } from "next/font/google";
import "boxicons/css/boxicons.min.css";
import "./globals.css";

/* Studio Log type: Archivo carries everything structural; Spline Sans Mono is
   reserved for figures (entry numbers, slot counts, dates, counts). See
   DESIGN.md. next/font self-hosts both at build — no runtime font request. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const figures = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figures",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stack Underflow",
  description:
    "Student collaboration hub: find portfolio projects, apply, and build together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${figures.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}