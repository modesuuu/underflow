import { AppShell } from "@/components/layout/AppShell";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

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
      actions={<CollabHeaderActions />}
    >
      <div className="theme-warm flex min-h-full flex-col gap-6 bg-bg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-72 rounded-md bg-placeholder" />
          <div className="h-4 w-80 rounded-md bg-placeholder" />
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
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="aspect-[16/10] w-full bg-placeholder/60" />
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                <div className="h-3.5 w-24 rounded bg-placeholder" />
                <div className="h-5 w-3/4 rounded bg-placeholder" />
                <div className="h-4 w-full rounded bg-placeholder" />
                <div className="h-4 w-2/3 rounded bg-placeholder" />
                <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                  <div className="h-6 w-24 rounded-full bg-placeholder" />
                  <div className="h-9 w-20 rounded-full bg-placeholder" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
