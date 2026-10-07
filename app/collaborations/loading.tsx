import { AppShell } from "@/components/layout/AppShell";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

/**
 * Route-level loading.tsx — shown while getCollabProjects() suspends in dev.
 * Skeleton matches the card grid shape (246x235 blocks, same grid + gaps).
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
          <div className="h-10 w-64 rounded-lg bg-placeholder" />
          <div className="h-4 w-80 rounded-md bg-placeholder" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-[42px] rounded-sm bg-placeholder" />
            <div className="size-[42px] rounded-sm bg-placeholder" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-[38px] w-56 rounded-md bg-placeholder" />
            <div className="h-[38px] w-24 rounded-md bg-placeholder" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-[246/235] flex-col justify-between rounded-xl bg-placeholder/60 p-5"
            >
              <div className="h-3.5 w-12 rounded bg-bg" />
              <div className="flex flex-col gap-2">
                <div className="h-7 w-4/5 rounded bg-bg" />
                <div className="h-4 w-3/5 rounded bg-bg" />
                <div className="h-3.5 w-24 rounded bg-bg" />
              </div>
              <div className="flex items-center justify-between">
                <div className="size-7 rounded-full bg-bg" />
                <div className="h-10 w-24 rounded-xl bg-bg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
