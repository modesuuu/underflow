import { AppShell } from "@/components/layout/AppShell";

export default function CircleIndexLoading() {
  return (
    <AppShell breadcrumbRoot="Dashboard" breadcrumbLeaf="Circle">
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-6 lg:mx-0 lg:ml-[28px] lg:px-0">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-32 rounded bg-placeholder" />
          <div className="h-4 w-56 rounded bg-placeholder" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="size-8 shrink-0 rounded-full bg-placeholder" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-4 w-1/2 rounded bg-placeholder" />
                <div className="h-3 w-1/3 rounded bg-placeholder" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
