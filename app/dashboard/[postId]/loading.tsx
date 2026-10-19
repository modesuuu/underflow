import { AppShell } from "@/components/layout/AppShell";
import { NotificationsPanelSkeleton } from "@/features/dashboard/components/NotificationsPanelSkeleton";

/**
 * Loading skeleton for /dashboard/[postId] — shaped like the real post detail
 * page: AppShell detail variant + notifications panel, one flat post body
 * (author row, text lines, single big photo area, action counters), then the
 * comment section (pill input bar + three comment rows).
 */
export default function PostDetailLoading() {
  return (
    <AppShell
      variant="detail"
      backLabel="Feed"
      backHref="/"
      panel={<NotificationsPanelSkeleton />}
    >
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 px-4 py-3 lg:mx-0 lg:ml-[28px] lg:px-0">
        {/* Post body — flat, mirroring PostDetailBody's rhythm */}
        <div className="flex flex-col gap-4">
          {/* Author row */}
          <div className="flex items-center gap-2.5">
            <div className="size-9 shrink-0 rounded-full bg-placeholder" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 rounded bg-placeholder" />
              <div className="h-3 w-16 rounded bg-placeholder" />
            </div>
          </div>
          {/* Body */}
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-full rounded bg-placeholder" />
            <div className="h-3.5 w-5/6 rounded bg-placeholder" />
            <div className="h-3.5 w-2/3 rounded bg-placeholder" />
          </div>
          {/* Photo area — single big block like the real PhotoViewer/PhotoGrid,
              not a small 2x2 grid */}
          <div className="h-[306px] rounded-md bg-placeholder/60" />
          {/* Action counters */}
          <div className="flex items-center gap-4">
            <div className="h-5 w-14 rounded bg-placeholder" />
            <div className="h-5 w-14 rounded bg-placeholder" />
            <div className="h-5 w-20 rounded bg-placeholder" />
          </div>
        </div>

        <div className="h-px w-full bg-placeholder" />

        {/* Comment section */}
        <div className="flex flex-col gap-6">
          {/* Input bar — the feed-pill shape */}
          <div className="flex items-center gap-2.5">
            <div className="size-7 shrink-0 rounded-full bg-placeholder" />
            <div className="h-10 flex-1 rounded-full bg-placeholder/60" />
          </div>
          {/* Comment rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="size-8 shrink-0 rounded-full bg-placeholder" />
                <div className="h-3 w-32 rounded bg-placeholder" />
              </div>
              <div className="flex flex-col gap-2 pl-10">
                <div className="h-3 w-full rounded bg-placeholder" />
                <div className="h-3 w-2/3 rounded bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
