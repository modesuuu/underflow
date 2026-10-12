import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PostButton } from "@/components/layout/PostButton";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { FeedColumn } from "@/features/dashboard/components/FeedColumn";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

/**
 * The feed page renders its shell synchronously and suspends only on the
 * data-bound sections, so navigation shows this page's own shape instead of
 * the root boundary. Fallbacks mirror the real sections.
 */

function FeedColumnSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 py-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="sheet flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 rounded-full bg-placeholder" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 rounded-sm bg-placeholder" />
              <div className="h-3 w-16 rounded-sm bg-placeholder" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-full rounded-sm bg-placeholder" />
            <div className="h-3.5 w-2/3 rounded-sm bg-placeholder" />
          </div>
          <div className="h-[306px] w-full rounded-sm bg-placeholder/60" />
          <div className="flex gap-5 border-t border-rule pt-4">
            <div className="h-5 w-12 rounded-sm bg-placeholder" />
            <div className="h-5 w-12 rounded-sm bg-placeholder" />
            <div className="h-5 w-20 rounded-sm bg-placeholder" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-7 p-6">
      <div className="h-5 w-32 rounded-sm bg-placeholder" />
      <div className="flex h-8 w-full border border-rule">
        <div className="flex-1 bg-placeholder/40" />
        <div className="flex-1 border-l border-rule bg-placeholder/40" />
        <div className="flex-1 border-l border-rule bg-placeholder/40" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="size-[30px] shrink-0 rounded-full bg-placeholder" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-3/4 rounded-sm bg-placeholder" />
            <div className="h-3 w-1/2 rounded-sm bg-placeholder" />
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
      {/* One real h1 per page — visually hidden so the TopBar breadcrumb
          stays the visual heading. */}
      <h1 className="sr-only">Feed</h1>
      <Suspense fallback={<FeedColumnSkeleton />}>
        <FeedColumnAsync />
      </Suspense>
    </AppShell>
  );
}