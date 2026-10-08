import { AppShell } from "@/components/layout/AppShell";

/**
 * Route-level loading.tsx for /my-collaborations — skeleton shaped like the
 * board: header + 4 stat cards + search row + 4 column placeholders.
 * Covers the nested category/detail routes too (one boundary per tree).
 */
export default function MyCollaborationsLoading() {
  return (
    <AppShell breadcrumbRoot="Tools" breadcrumbLeaf="My Collaborations">
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-72 rounded-lg bg-placeholder" />
          <div className="h-4 w-48 rounded-md bg-placeholder" />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-1 items-center gap-3 rounded-lg bg-placeholder/60 p-4"
            >
              <div className="size-9 rounded-md bg-bg" />
              <div className="flex flex-col gap-1.5">
                <div className="h-6 w-16 rounded bg-bg" />
                <div className="h-3 w-24 rounded bg-bg" />
              </div>
            </div>
          ))}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl bg-placeholder/40 p-4"
            >
              <div className="h-6 w-2/3 rounded-full bg-bg" />
              <div className="h-40 rounded-xl bg-placeholder/60" />
              <div className="h-10 rounded-md bg-bg" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
