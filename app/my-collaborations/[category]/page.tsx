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
 * its AppShell and header (toolbar + 6-card grid), which renders here while
 * getMyCollabProjects() suspends. The category labels come from the sync
 * meta-map, so the shell + header render immediately.
 */
function MyCollabCategoryGridSkeleton() {
  return (
    <>
      {/* Toolbar mirrors MyCollabSearchBar: sort+filter icon buttons left,
          search group (input + Search button) right */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-[42px] rounded-sm bg-placeholder" />
          <div className="size-[42px] rounded-sm bg-placeholder" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-[42px] w-64 items-center gap-2 rounded-md border border-line bg-surface px-4">
            <div className="size-4 shrink-0 rounded-full bg-placeholder" />
            <div className="h-3 flex-1 rounded bg-placeholder" />
          </div>
          <div className="h-[42px] w-24 rounded-md bg-placeholder" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[235px] flex-col justify-between rounded-xl bg-bg p-5"
          >
            <div className="flex flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-placeholder" />
              <div className="h-3 w-1/2 rounded bg-placeholder" />
            </div>
            <div className="h-28 rounded-lg bg-placeholder/60" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-placeholder" />
              <div className="h-3 w-16 rounded bg-placeholder" />
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
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[40px] font-medium leading-[1.02] text-ink">
            {cat.boardLabel}
          </h1>
          <p className="text-sm font-medium text-muted">{cat.subtitle}</p>
        </div>
        <Suspense fallback={<MyCollabCategoryGridSkeleton />}>
          <MyCollabCategoryGridAsync status={cat.slug} />
        </Suspense>
      </div>
    </AppShell>
  );
}
