import { AppShell } from "@/components/layout/AppShell";
import { CollabHeaderActions } from "@/features/collaborations/components/CollabHeaderActions";

/**
 * Route-level loading.tsx — shown while getCollabProjects() suspends in dev.
 * Skeleton mirrors the real page: 56px display title, two 42px sort/filter
 * icon buttons left + search group right (same order as SearchFilterBar),
 * and an 8-card grid with the same sm:col-span-2 featured first card and
 * CollabCard anatomy. Cards use a fixed height — the real cards are equal
 * height regardless of span width, so the featured card must not stretch.
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
          <div className="h-[57px] w-[420px] rounded-lg bg-placeholder" />
          <div className="h-4 w-80 rounded-md bg-placeholder" />
        </div>

        {/* Toolbar mirrors SearchFilterBar: sort+filter icon buttons left,
            search group (input + Search button) right */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-[42px] rounded-sm bg-placeholder" />
            <div className="size-[42px] rounded-sm bg-placeholder" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-[42px] w-64 items-center gap-2 rounded-md border border-line bg-surface px-4">
              <div className="size-4 shrink-0 rounded-full bg-placeholder" />
              <div className="h-3 flex-1 rounded bg-placeholder" />
            </div>
            <div className="h-[42px] w-24 rounded-md bg-placeholder" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex h-[235px] flex-col justify-between rounded-xl bg-bg p-5 ${
                i === 0 ? "sm:col-span-2" : ""
              }`}
            >
              {/* status row */}
              <div className="h-3.5 w-12 rounded bg-placeholder" />
              <div className="flex flex-col gap-2">
                <div className="h-7 w-4/5 rounded bg-placeholder" />
                <div className="h-4 w-3/5 rounded bg-placeholder" />
                <div className="h-3.5 w-24 rounded bg-placeholder" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-placeholder" />
                  <div className="size-7 -ml-3 rounded-full bg-placeholder" />
                </div>
                <div className="h-10 w-24 rounded-xl bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
