import { AppShell } from "@/components/layout/AppShell";

/**
 * Route-level loading.tsx for /my-collaborations — skeleton
 * shaped like the board: header + the project grid (label +
 * filter row + card grid). Nested category/detail routes have
 * their own shaped skeletons.
 */
export default function MyCollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
    >
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header: title + New Project, stats right */}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-80 max-w-full rounded-lg bg-placeholder" />
            <div className="h-9 w-32 rounded-full bg-placeholder" />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-8 w-12 rounded bg-placeholder" />
                <div className="h-3 w-20 rounded bg-placeholder" />
              </div>
            ))}
          </div>
        </div>

        {/* Projects: label + filter row + card grid */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-40 rounded-full bg-placeholder" />
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <div className="h-9 w-44 rounded-full border border-line bg-surface" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-full border border-line bg-surface" />
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[216px] rounded-2xl border border-line bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
