import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
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
 * its AppShell and header (toolbar + card grid), which renders here while
 * getMyCollabProjects() suspends. Category labels come from the sync meta-map,
 * so the shell + header render immediately.
 */
function MyCollabCategoryGridSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-[42px] rounded-sm border border-rule bg-placeholder/50" />
          <div className="size-[42px] rounded-sm border border-rule bg-placeholder/50" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-[38px] w-64 border-b border-rule" />
          <div className="h-[38px] w-24 rounded-sm bg-placeholder" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="sheet flex h-[235px] flex-col gap-3 p-4"
          >
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-placeholder" />
              <div className="h-3 w-16 rounded-sm bg-placeholder" />
            </div>
            <div className="h-5 w-4/5 rounded-sm bg-placeholder" />
            <div className="h-3 w-3/5 rounded-sm bg-placeholder" />
            <div className="mt-1 flex gap-[3px]">
              {Array.from({ length: 4 }).map((__, j) => (
                <div
                  key={j}
                  className="h-[10px] w-[6px] rounded-[1px] bg-placeholder"
                />
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-rule pt-3">
              <div className="h-5 w-24 rounded-sm bg-placeholder" />
              <div className="flex items-center">
                <div className="size-6 rounded-full bg-placeholder" />
                <div className="-ml-2 size-6 rounded-full bg-placeholder" />
              </div>
            </div>
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
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-8 py-8">
        <div className="flex flex-col gap-2 border-b border-ink pb-4">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-ink">
            {cat.boardLabel}
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