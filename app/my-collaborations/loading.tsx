import { AppShell } from "@/components/layout/AppShell";

/**
 * Route-level loading.tsx for /my-collaborations — skeleton
 * shaped like the board: header, the portfolio band, the
 * attention card, the search-first toolbar, two status
 * sections. Nested category/detail routes have their own
 * shaped skeletons.
 */
export default function MyCollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
    >
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="h-9 w-72 rounded-lg bg-placeholder" />

        {/* The band */}
        <div className="flex flex-col gap-5 rounded-[24px] bg-bg p-6">
          <div className="flex items-center gap-8">
            <div className="h-14 w-36 rounded bg-placeholder" />
            <div className="hidden flex-1 gap-4 sm:grid sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 rounded bg-placeholder" />
              ))}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-placeholder" />
          <div className="h-3 w-64 rounded bg-placeholder" />
        </div>

        {/* Attention: spotlight + pair */}
        <div className="flex flex-col gap-3">
          <div className="h-[84px] rounded-2xl border border-line bg-surface" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-[76px] rounded-2xl border border-line bg-surface" />
            <div className="h-[76px] rounded-2xl border border-line bg-surface" />
          </div>
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

        {/* Sections */}
        {Array.from({ length: 2 }).map((_, s) => (
          <div key={s} className="flex flex-col gap-3">
            <div className="h-6 w-40 rounded-full bg-placeholder" />
            <div className="flex flex-col divide-y divide-line/50 border-y border-line/50">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 py-3">
                  <div className="h-4 w-1/3 rounded bg-placeholder" />
                  <div className="h-3 w-1/4 rounded bg-placeholder" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
