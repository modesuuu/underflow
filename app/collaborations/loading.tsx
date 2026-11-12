import { AppShell } from "@/components/layout/AppShell";
import { CollabTopBarActions } from "@/features/collaborations/components/CollabTopBarActions";

/**
 * Route-level loading.tsx — shown while getCollabProjects() suspends
 * in dev. Skeleton mirrors the river board: plain title block and
 * project cards. The search controls render live in the TopBar
 * (AppShell actions), not as a skeleton.
 */
export default function CollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Collaborations"
      actions={<CollabTopBarActions />}
    >
      <div className="flex min-h-full flex-col gap-6 collab-ground px-4 pt-6 pb-24 sm:px-6 sm:pt-8 sm:pb-8">
        <div className="flex flex-col gap-1.5">
          <div className="h-10 w-72 rounded-md bg-placeholder" />
          <div className="h-5 w-80 max-w-full rounded bg-placeholder/70" />
        </div>


        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="collab-card flex flex-col rounded-lg border border-line p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 rounded-full bg-placeholder" />
                <div className="h-6 w-16 rounded-full bg-placeholder/60" />
              </div>
              <div className="mt-3.5 h-5 w-2/3 rounded bg-placeholder" />
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="h-3.5 w-full rounded bg-placeholder/70" />
                <div className="h-3.5 w-4/5 rounded bg-placeholder/70" />
              </div>
              <div className="mt-auto flex gap-1.5 pt-4">
                <div className="h-6 w-16 rounded-full bg-placeholder/70" />
                <div className="h-6 w-20 rounded-full bg-placeholder/70" />
                <div className="h-6 w-14 rounded-full bg-placeholder/70" />
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-24 rounded bg-placeholder" />
                  <div className="h-3 w-16 rounded bg-placeholder/70" />
                </div>
                <div className="h-8 w-20 rounded-full bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
