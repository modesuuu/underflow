import { AppShell } from "@/components/layout/AppShell";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

/**
 * Route-level loading.tsx — shown while getCollabProjects() suspends
 * in dev. Skeleton mirrors the index + preview board: plain title
 * block, search-first toolbar, hairline index rows, and the
 * preview pane block.
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

        {/* Toolbar mirrors the search-first SearchFilterBar */}
        <div className="flex items-center gap-3">
          <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
          <div className="h-11 w-24 rounded-xl bg-placeholder" />
          <div className="ms-auto flex items-center gap-2">
            <div className="h-11 w-32 rounded-xl bg-placeholder" />
            <div className="h-11 w-28 rounded-xl bg-placeholder" />
          </div>
        </div>

        {/* Index rows + preview pane */}
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col divide-y divide-placeholder border-y border-placeholder">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-3 py-3.5">
                  <div className="size-2 rounded-full bg-placeholder" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-4 w-2/5 rounded bg-placeholder" />
                    <div className="h-3 w-1/3 rounded bg-placeholder" />
                  </div>
                  <div className="h-3 w-16 rounded bg-placeholder" />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden w-[380px] shrink-0 flex-col gap-4 rounded-2xl bg-bg p-5 lg:flex">
            <div className="aspect-[2/1] w-full rounded-xl bg-placeholder/60" />
            <div className="h-6 w-3/4 rounded bg-placeholder" />
            <div className="h-4 w-full rounded bg-placeholder" />
            <div className="h-4 w-2/3 rounded bg-placeholder" />
            <div className="h-11 w-full rounded-full bg-placeholder" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
