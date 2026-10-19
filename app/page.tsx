import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PostButton } from "@/components/layout/PostButton";
import { getDashboardPosts } from "@/features/dashboard/api";
import { FeedColumn } from "@/features/dashboard/components/FeedColumn";

/**
 * The feed page keeps its own shaped skeleton (post-card stack + notifications
 * stack) by fetching inside two small async server components wrapped in
 * Suspense, instead of awaiting in the page itself and falling back to the
 * root loading boundary (which is now deliberately page-neutral).
 */

function FeedColumnSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-3 lg:mx-0 lg:ml-[28px] lg:px-0">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-1 py-2">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-placeholder" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 rounded bg-placeholder" />
              <div className="h-3 w-16 rounded bg-placeholder" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-3.5 w-full rounded bg-placeholder" />
            <div className="h-3.5 w-2/3 rounded bg-placeholder" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="aspect-square rounded-md bg-placeholder/60" />
            <div className="aspect-square rounded-md bg-placeholder/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function FeedColumnAsync() {
  const posts = await getDashboardPosts();
  return <FeedColumn posts={posts} />;
}

export default function Home() {
  return (
    <AppShell
      actions={<PostButton />}
    >
      {/* P1-C #20: one real h1 per page — visually hidden so the
          breadcrumb in the TopBar stays the visual heading. */}
      <h1 className="sr-only">Feed</h1>
      <Suspense fallback={<FeedColumnSkeleton />}>
        <FeedColumnAsync />
      </Suspense>
    </AppShell>
  );
}
