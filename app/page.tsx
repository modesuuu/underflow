import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PostButton } from "@/components/layout/PostButton";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { FeedColumn } from "@/features/dashboard/components/FeedColumn";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

/**
 * The feed page keeps its own shaped skeleton (post-card stack + notifications
 * stack) by fetching inside two small async server components wrapped in
 * Suspense, instead of awaiting in the page itself and falling back to the
 * root loading boundary (which is now deliberately page-neutral).
 */

function FeedColumnSkeleton() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-12 py-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5">
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

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg bg-bg p-4">
          <div className="h-3.5 w-3/4 rounded bg-placeholder" />
          <div className="h-3 w-1/2 rounded bg-placeholder" />
        </div>
      ))}
    </div>
  );
}

async function FeedColumnAsync() {
  const posts = await getDashboardPosts();
  return <FeedColumn posts={posts} />;
}

async function NotificationsPanelAsync() {
  const notifications = await getNotifications();
  return <NotificationsPanel notifications={notifications} />;
}

export default function Home() {
  return (
    <AppShell
      panel={
        <Suspense fallback={<NotificationsSkeleton />}>
          <NotificationsPanelAsync />
        </Suspense>
      }
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
