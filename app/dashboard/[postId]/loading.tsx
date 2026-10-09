import { AppShell } from "@/components/layout/AppShell";

/**
 * Loading skeleton for /dashboard/[postId] — shaped like the real post detail
 * page: AppShell detail variant + notifications panel, one large post card
 * (author row, text lines, single big photo area, action counters), then the
 * comment section (input bar + three comment rows).
 */
export default function PostDetailLoading() {
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
      variant="detail"
      backLabel="Feed"
      backHref="/"
    >
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
        {/* Post card */}
        <div className="rounded-xl border border-line bg-surface p-5">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <div className="size-8 shrink-0 rounded-full bg-placeholder" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 rounded bg-placeholder" />
              <div className="h-3 w-16 rounded bg-placeholder" />
            </div>
          </div>
          {/* Body */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-3.5 w-full rounded bg-placeholder" />
            <div className="h-3.5 w-5/6 rounded bg-placeholder" />
            <div className="h-3.5 w-2/3 rounded bg-placeholder" />
          </div>
          {/* Photo area — single big block like the real PhotoViewer/PhotoGrid,
              not a small 2x2 grid */}
          <div className="mt-4 h-[306px] rounded-md bg-placeholder/60" />
          {/* Action counters */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-6 w-14 rounded bg-placeholder" />
            <div className="h-6 w-14 rounded bg-placeholder" />
            <div className="h-6 w-20 rounded bg-placeholder" />
          </div>
        </div>

        {/* Comment section */}
        <div className="flex flex-col gap-6">
          {/* Input bar */}
          <div className="flex items-center gap-3">
            <div className="size-8 shrink-0 rounded-full bg-placeholder" />
            <div className="flex h-[42px] flex-1 items-center rounded-lg border border-accent bg-surface p-2">
              <div className="h-3.5 w-1/2 rounded bg-placeholder" />
            </div>
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
