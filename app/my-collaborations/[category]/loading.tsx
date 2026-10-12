import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

/**
 * Route-level loading.tsx — mirrors the real category page: ruled heading
 * (label + subtitle), the toolbar, then the card grid in MyCollabCard
 * anatomy (status row, capacity strip, due row).
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
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-8 py-8">
        <div className="flex flex-col gap-2 border-b border-ink pb-4">
          <div className="h-10 w-[320px] rounded-sm bg-placeholder" />
          <div className="h-4 w-72 rounded-sm bg-placeholder" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-[42px] rounded-sm border border-rule bg-placeholder/50" />
            <div className="size-[42px] rounded-sm border border-rule bg-placeholder/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-[38px] w-64 border-b border-rule" />
            <div className="h-[38px] w-24 rounded-sm bg-placeholder" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sheet flex h-[235px] flex-col gap-3 p-4">
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-placeholder" />
                <div className="h-3 w-16 rounded-sm bg-placeholder" />
              </div>
              <div className="h-5 w-4/5 rounded-sm bg-placeholder" />
              <div className="h-3 w-3/5 rounded-sm bg-placeholder" />
              <div className="mt-1 flex gap-[3px]">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-[10px] w-[6px] rounded-[1px] bg-placeholder"
                  />
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-rule pt-3">
                <div className="h-5 w-24 rounded-sm bg-placeholder" />
                <div className="flex items-center">
                  <div className="size-6 rounded-full bg-placeholder" />
                  <div className="-ml-2 size-6 rounded-full bg-placeholder" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}