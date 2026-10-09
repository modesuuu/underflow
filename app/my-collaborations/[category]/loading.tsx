import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

/**
 * Loading skeleton for /my-collaborations/[category] — shaped like the real
 * category page: title + subtitle, a toolbar mirroring MyCollabSearchBar
 * (sort+filter icon buttons left, search group right), and a 6-card grid.
 * Loading receives no params, so the labels are generic by design.
 */
export default function MyCollabCategoryLoading() {
  return (
    <AppShell
      backLabel="My Collaborations"
      backHref="/my-collaborations"
      breadcrumbRoot="Tools / My Collaborations"
      breadcrumbLeaf="Category"
      actions={<NotificationsBell />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <div className="h-14 w-96 rounded-lg bg-placeholder" />
          <div className="h-4 w-64 rounded-md bg-placeholder" />
        </div>
        {/* Toolbar mirrors MyCollabSearchBar: sort+filter icon buttons left,
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[235px] flex-col justify-between rounded-xl bg-bg p-5"
            >
              <div className="flex flex-col gap-2">
                <div className="h-4 w-3/4 rounded bg-placeholder" />
                <div className="h-3 w-1/2 rounded bg-placeholder" />
              </div>
              <div className="h-28 rounded-lg bg-placeholder/60" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-placeholder" />
                <div className="h-3 w-16 rounded bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
