import { CircleWorkspace } from "@/features/circle/components/CircleWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Circle",
};


export default function CirclePage() {
  return <CircleWorkspace />;
}
