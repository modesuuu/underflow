import { AppShell } from "@/components/layout/AppShell";

/**
 * Root loading skeleton (P1-B #13) — shown while getDashboardPosts /
 * getNotifications suspend on `/` and `/dashboard/[postId]`. The
 * right-hand notifications panel is a simple stacked list; the feed
 * column is a stack of post cards (avatar + text lines + photo grid).
 */
export default function RootLoading() {
  return (
    <AppShell
      panel={
        <div className="flex flex-col gap-5 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg bg-bg p-4">
              <div className="h-3.5 w-3/4 rounded bg-placeholder" />
              <div className="h-3 w-1/2 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      }
    >
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
    </AppShell>
  );
}
