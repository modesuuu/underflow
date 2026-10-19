import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MyCollabCategoryGrid } from "@/features/my-collaborations/components/MyCollabCategoryGrid";
import { getCategory } from "@/features/my-collaborations/types";

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
        <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
        <div className="h-11 w-24 rounded-xl bg-placeholder" />
        <div className="ms-auto flex items-center gap-2">
          <div className="h-11 w-32 rounded-xl bg-placeholder" />
          <div className="h-11 w-28 rounded-xl bg-placeholder" />
        </div>
      </div>
      {/* Rows */}
      <div className="flex flex-col divide-y divide-line/50 border-y border-line/50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 py-3">
            <div className="h-4 w-1/3 rounded bg-placeholder" />
            <div className="h-3 w-1/4 rounded bg-placeholder" />
          </div>
        ))}
      </div>
    </>
  );
}

async function MyCollabCategoryGridAsync({ status }: { status: string }) {
  const all = await getMyCollabProjects();
  const projects = all.filter((p) => p.myStatus === status);
  return <MyCollabCategoryGrid projects={projects} />;
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
      actions={<NotificationsBell />}
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
