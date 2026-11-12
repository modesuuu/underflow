import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MyCollabCategoryGrid } from "@/features/my-collaborations/components/MyCollabCategoryGrid";
import {
  MY_COLLAB_CATEGORIES,
  getCategory,
} from "@/features/my-collaborations/types";
import type { MyCollabStatus } from "@/features/my-collaborations/types";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  return params.then(({ category }) => {
    const cat = getCategory(category);
    return {
      title: cat ? `My Collaborations — ${cat.crumbLabel}` : "My Collaborations",
      description: cat?.subtitle ?? "My collaborations category.",
    };
  });
}

/**
 * Fallback = the body of app/my-collaborations/[category]/loading.tsx minus
 * its AppShell and header (search-first toolbar + row list), which renders
 * here while getMyCollabProjects() suspends. The category labels come from
 * the sync meta-map, so the shell + header render immediately.
 */
function MyCollabCategoryGridSkeleton() {
  return (
    <>
      {/* Toolbar: search-first */}
      <div className="flex items-center gap-3">
        <div className="h-11 flex-1 rounded-lg border border-line bg-surface sm:max-w-md" />
        <div className="h-11 w-24 rounded-lg bg-placeholder" />
        <div className="ms-auto flex items-center gap-2">
          <div className="h-11 w-32 rounded-lg bg-placeholder" />
          <div className="h-11 w-28 rounded-lg bg-placeholder" />
        </div>
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[168px] rounded-liquid bg-placeholder/50" />
        ))}
      </div>
    </>
  );
}

async function MyCollabCategoryGridAsync({ status }: { status: MyCollabStatus }) {
  const all = await getMyCollabProjects();
  const projects = all.filter((p) => p.myStatus === status);
  // Global pastel offset: sum of the counts of the categories
  // before this one, so a project keeps its board tint here.
  const order = MY_COLLAB_CATEGORIES.map((c) => c.slug);
  const startIndex = order
    .slice(0, order.indexOf(status))
    .reduce(
      (sum, slug) => sum + all.filter((p) => p.myStatus === slug).length,
      0
    );
  return <MyCollabCategoryGrid projects={projects} startIndex={startIndex} />;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  return (
    <AppShell
      backLabel="My Collaborations"
      backHref="/my-collaborations"
      breadcrumbRoot="Tools / My Collaborations"
      breadcrumbLeaf={cat.crumbLabel}
    >
      <div className="page-enter flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3">
          <span
            className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cat.pillClassName}`}
          >
            <Icon name={cat.icon} size={14} />
            {cat.boardLabel}
          </span>
          <h1 className="text-[28px] font-semibold text-ink">
            {cat.crumbLabel}
          </h1>
          <p className="text-sm text-muted">{cat.subtitle}</p>
        </div>
        <Suspense fallback={<MyCollabCategoryGridSkeleton />}>
          <MyCollabCategoryGridAsync status={cat.slug} />
        </Suspense>
      </div>
    </AppShell>
  );
}
