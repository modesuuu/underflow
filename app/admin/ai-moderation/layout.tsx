import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Moderation",
};

export default function AiModerationLayout({ children }: { children: ReactNode }) {
  return children;
}
