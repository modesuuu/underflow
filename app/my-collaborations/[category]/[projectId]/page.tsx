import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MyCollabDetailLoader } from "@/features/my-collaborations/components/MyCollabDetailLoader";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { getCategory } from "@/features/my-collaborations/types";

interface DetailPageProps {
  params: Promise<{ category: string; projectId: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  // The project title cannot be in the metadata: the project
  // is user-scoped and loads client-side (see the loader), so
  // the server never sees it. The category label is the most
  // specific honest title available here.
  const { category } = await params;
  const cat = getCategory(category);
  return {
    title: cat
      ? `My Collaborations — ${cat.crumbLabel}`
      : "My Collaborations",
    description: "My collaboration project detail.",
  };
}

/**
 * Exception case: breadcrumbLeaf is the project TITLE (a data-bound value),
 * so the AppShell cannot render until the project loads client-side.
 * The loader's fallback is this entire body (the current
 * app/my-collaborations/[category]/[projectId]/loading.tsx body, which
 * already includes its own AppShell).
 */
function MyCollabDetailLoadingBody() {
  return (
    <AppShell
      variant="detail"
      backLabel="Category"
      backHref="/my-collaborations"
      panel={<NotificationsPanel className="px-6" />}
    >
      <div className="flex flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
        {/* 1. Header band */}
        <div className="flex flex-col gap-4 rounded-lg p-6">
          <div className="h-6 w-24 rounded-full bg-bg" />
          <div className="h-10 w-2/3 rounded-lg bg-placeholder" />
          <div className="flex items-center gap-4">
            <div className="h-3.5 w-28 rounded bg-placeholder" />
            <div className="h-3.5 w-24 rounded bg-placeholder" />
          </div>
          <div className="grid h-[220px] grid-cols-2 grid-rows-2 gap-3 sm:h-[306px] sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* 2. Owner card + about + work items */}
        <div className="flex flex-col gap-4 rounded-lg bg-bg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-[42px] shrink-0 rounded-full bg-placeholder" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-28 rounded bg-placeholder" />
                <div className="h-3 w-20 rounded bg-placeholder" />
              </div>
            </div>
            <div className="h-9 w-36 rounded-full bg-placeholder" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-44 rounded bg-placeholder" />
            <div className="h-3 w-full rounded bg-placeholder" />
            <div className="h-3 w-5/6 rounded bg-placeholder" />
            <div className="h-3 w-2/3 rounded bg-placeholder" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-48 rounded bg-placeholder" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-1.5 shrink-0 rounded-full bg-placeholder" />
                <div className="h-3 w-3/4 rounded bg-placeholder" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Skills */}
        <div className="flex flex-col gap-3">
          <div className="h-5 w-28 rounded bg-placeholder" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* 4. Team — filled members + open slot */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 rounded bg-placeholder" />
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-10 rounded bg-placeholder" />
              <div className="size-5 rounded bg-placeholder" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-[32px] shrink-0 rounded-full bg-placeholder" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-24 rounded bg-placeholder" />
                  <div className="h-2.5 w-16 rounded bg-placeholder" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Open Circle + bottom CTA */}
        <div className="h-12 w-full rounded-md bg-placeholder" />
        <div className="h-12 w-full rounded-md bg-placeholder" />
      </div>
    </AppShell>
  );
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, projectId } = await params;

  // An unknown category slug is a 404 right here (sync check).
  // The project itself loads in the client loader: it is
  // user-scoped and the server has no session token for it.
  // The loader 404s when the project is not in the user's list
  // or its myStatus does not match this category.
  const cat = getCategory(category);
  if (!cat) notFound();

  return (
    <MyCollabDetailLoader
      category={cat}
      projectId={projectId}
      fallback={<MyCollabDetailLoadingBody />}
    />
  );
}
