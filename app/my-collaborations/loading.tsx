import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

/**
 * Route-level loading.tsx — mirrors the real board: ruled heading, a 4-tally
 * stats row, the toolbar, then 4 status columns with card + capacity anatomy.
 */
export default function MyCollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
      actions={<NotificationsBell />}
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-8 py-8">
        <div className="flex flex-col gap-2 border-b border-ink pb-4">
          <div className="h-10 w-[380px] rounded-sm bg-placeholder" />
          <div className="h-4 w-56 rounded-sm bg-placeholder" />
        </div>

        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="sheet flex flex-1 flex-col gap-2 p-5"
            >
              <div className="h-3 w-28 rounded-sm bg-placeholder" />
              <div className="h-8 w-20 rounded-sm bg-placeholder" />
            </div>
          ))}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-lg border border-rule bg-bg/60 p-4"
            >
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <div className="h-3.5 w-28 rounded-sm bg-placeholder" />
                <div className="size-5 rounded-sm bg-placeholder" />
              </div>
              <div className="sheet flex h-32 flex-col gap-2 p-4">
                <div className="h-4 w-4/5 rounded-sm bg-placeholder" />
                <div className="h-3 w-3/5 rounded-sm bg-placeholder" />
                <div className="mt-1 flex gap-[3px]">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div
                      key={j}
                      className="h-[10px] w-[6px] rounded-[1px] bg-placeholder"
                    />
                  ))}
                </div>
              </div>
              <div className="h-8 w-full rounded-sm border border-rule" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}