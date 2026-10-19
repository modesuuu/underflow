import { AppShell } from "@/components/layout/AppShell";

export default function CircleWorkspaceLoading() {
  return (
    <AppShell fill breadcrumbRoot="Dashboard / Circle" backLabel="Circles" backHref="/circle" variant="detail">
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[260px] shrink-0 flex-col gap-3 border-r border-line p-4 lg:flex">
          <div className="h-5 w-3/4 rounded bg-placeholder" />
          <div className="h-3 w-1/2 rounded bg-placeholder" />
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-9 rounded-lg bg-placeholder" />
            <div className="h-9 rounded-lg bg-placeholder" />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[52px] items-center border-b border-line px-4">
            <div className="h-5 w-32 rounded bg-placeholder" />
          </div>
          <div className="flex flex-1 flex-col gap-5 overflow-hidden p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="size-9 shrink-0 rounded-full bg-placeholder" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3.5 w-28 rounded bg-placeholder" />
                  <div className="h-3.5 w-2/3 rounded bg-placeholder" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 pt-0">
            <div className="h-11 rounded-full bg-placeholder" />
          </div>
        </div>
        <div className="hidden w-[308px] shrink-0 flex-col gap-3 border-l border-line p-4 xl:flex">
          <div className="h-5 w-24 rounded bg-placeholder" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-placeholder" />
              <div className="h-3.5 w-24 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
