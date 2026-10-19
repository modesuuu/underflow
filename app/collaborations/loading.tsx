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
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 rounded-md bg-placeholder" />
          <div className="h-4 w-80 rounded-md bg-placeholder" />
        </div>

        {/* Toolbar + facets */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
            <div className="h-11 w-24 rounded-xl bg-placeholder" />
            <div className="ms-auto flex items-center gap-2">
              <div className="h-11 w-32 rounded-xl bg-placeholder" />
              <div className="h-11 w-28 rounded-xl bg-placeholder" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-placeholder/70" />
            ))}
          </div>
        </div>

        {/* Bands */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-bg p-4">
              <div className="hidden size-[84px] shrink-0 rounded-xl bg-placeholder/60 sm:block" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3.5 w-24 rounded bg-placeholder" />
                <div className="h-5 w-2/5 rounded bg-placeholder" />
                <div className="h-4 w-1/3 rounded bg-placeholder" />
                <div className="h-3.5 w-1/2 rounded bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
