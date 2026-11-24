import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Content",
};

export default function ContentLayout({ children }: { children: ReactNode }) {
  return children;
}
