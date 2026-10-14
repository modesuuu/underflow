import { AppShell } from "@/components/layout/AppShell";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

/**
 * Route-level loading.tsx — shown while getCollabProjects() suspends
 * in dev. Skeleton mirrors the redesigned page: plain title block,
 * search-first toolbar, and a uniform 3-column grid of
 * capacity-card shapes (status row, title, meter, owner footer).
 */
export default function CollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Collaborations"
      actions={<CollabHeaderActions />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 rounded-md bg-placeholder" />
          <div className="h-4 w-80 rounded-md bg-placeholder" />
        </div>

        {/* Toolbar mirrors the new SearchFilterBar: search left,
            labeled sort/filter buttons right */}
        <div className="flex items-center gap-3">
          <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
          <div className="h-11 w-24 rounded-xl bg-placeholder" />
          <div className="ms-auto flex items-center gap-2">
            <div className="h-11 w-32 rounded-xl bg-placeholder" />
            <div className="h-11 w-28 rounded-xl bg-placeholder" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[235px] flex-col justify-between rounded-2xl border border-line bg-surface p-5"
            >
              {/* status row */}
              <div className="h-3.5 w-12 rounded bg-placeholder" />
              <div className="flex flex-col gap-2">
                <div className="h-6 w-4/5 rounded bg-placeholder" />
                <div className="h-4 w-3/5 rounded bg-placeholder" />
              </div>
              {/* capacity meter */}
              <div className="h-1.5 w-full rounded-full bg-placeholder" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-placeholder" />
                  <div className="h-3.5 w-20 rounded bg-placeholder" />
                </div>
                <div className="h-3.5 w-16 rounded bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
