import { AppShell } from "@/components/layout/AppShell";

/**
 * Route-level loading.tsx — shown while getCollabProjects() suspends
 * in dev. Skeleton mirrors the river board: plain title block,
 * search-first toolbar with facet pills, and project bands.
 */
export default function CollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Collaborations"
    >
      <div className="theme-warm flex min-h-full flex-col gap-6 bg-bg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="h-10 w-72 rounded-md bg-placeholder" />
          <div className="h-11 w-36 rounded-full bg-placeholder" />
        </div>

        {/* Schedule bar */}
        <div className="h-12 w-full rounded-full bg-placeholder/70" />

        {/* Section header */}
        <div className="flex items-baseline gap-3">
          <div className="h-6 w-36 rounded bg-placeholder" />
          <div className="h-4 w-16 rounded bg-placeholder" />
        </div>

        {/* Toolbar + facets */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 flex-1 rounded-full border border-line bg-surface sm:max-w-md" />
            <div className="h-11 w-24 rounded-full bg-placeholder" />
            <div className="ms-auto flex items-center gap-2">
              <div className="h-11 w-32 rounded-full bg-placeholder" />
              <div className="h-11 w-28 rounded-full bg-placeholder" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-placeholder/70" />
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="size-14 shrink-0 rounded-full bg-placeholder" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 rounded bg-placeholder" />
                  <div className="h-3.5 w-1/2 rounded bg-placeholder" />
                </div>
                <div className="size-9 shrink-0 rounded-full bg-placeholder" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-6 w-16 rounded-full bg-placeholder/70" />
                <div className="h-6 w-20 rounded-full bg-placeholder/70" />
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                <div className="h-3.5 w-28 rounded bg-placeholder" />
                <div className="h-9 w-20 rounded-full bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
