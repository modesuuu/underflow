import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SearchExplorer } from "@/features/search/components/SearchExplorer";
import { tStatic } from "@/lib/i18n/format";

export const metadata: Metadata = {
  title: "Search — Underflow",
  description: "Search people, projects, and skills on Underflow.",
};

export default function SearchPage() {
  return (
    <AppShell breadcrumbRoot="Tools" breadcrumbLeaf="Search">
      <h1 className="sr-only">{tStatic("search.title")}</h1>
      <Suspense fallback={null}>
        <SearchExplorer />
      </Suspense>
    </AppShell>
  );
}
