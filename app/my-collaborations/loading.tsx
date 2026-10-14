import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

/**
 * Route-level loading.tsx for /my-collaborations — skeleton
 * shaped like the staged board: header, the summary band,
 * the search-first toolbar, then the stage (attention panels
 * and two status sections on ink). Nested category/detail
 * routes have their own shaped skeletons.
 */
export default function MyCollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
      actions={<NotificationsBell />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="h-9 w-72 rounded-lg bg-placeholder" />

        {/* The band */}
        <div className="flex flex-col gap-5 rounded-[24px] bg-bg p-6">
          <div className="flex items-end justify-between gap-6">
            <div className="h-14 w-44 rounded bg-placeholder" />
            <div className="hidden gap-6 sm:flex">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-14 rounded bg-placeholder" />
              ))}
            </div>
          </div>
          <div className="h-3.5 w-full rounded-full bg-placeholder" />
          <div className="h-3 w-64 rounded bg-placeholder" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
          <div className="h-11 w-24 rounded-xl bg-placeholder" />
          <div className="ms-auto flex items-center gap-2">
            <div className="h-11 w-32 rounded-xl bg-placeholder" />
            <div className="h-11 w-28 rounded-xl bg-placeholder" />
          </div>
        </div>

        {/* The stage */}
        <div className="flex flex-col gap-8 rounded-[28px] bg-ink p-7">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] rounded-2xl bg-surface/10"
              />
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="flex flex-col gap-3">
              <div className="h-5 w-40 rounded-full bg-surface/15" />
              <div className="flex flex-col divide-y divide-surface/10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5 py-3">
                    <div className="h-4 w-1/3 rounded bg-surface/15" />
                    <div className="h-3 w-1/4 rounded bg-surface/10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
