import { AppShell } from "@/components/layout/AppShell";
import { MyCollabTopBarActions } from "@/features/my-collaborations/components/MyCollabTopBarActions";

/**
 * Route-level loading.tsx for /my-collaborations — skeleton
 * shaped like the board: header + the project grid (label +
 * filter row + card grid). Nested category/detail routes have
 * their own shaped skeletons.
 */
export default function MyCollaborationsLoading() {
  return (
    <AppShell
      breadcrumbRoot="Tools"
      breadcrumbLeaf="My Collaborations"
      actions={<MyCollabTopBarActions />}
    >
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header: title + subtitle (search lives in the TopBar). */}
        <div className="flex flex-col gap-1.5">
          <div className="h-10 w-80 max-w-full rounded-lg bg-placeholder" />
          <div className="h-4 w-48 rounded bg-placeholder" />
        </div>

        {/* Kanban: four column placeholders, each with a header + 3 cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center gap-2 px-1 pt-1">
                <div className="size-6 rounded-full bg-placeholder" />
                <div className="h-4 w-24 rounded bg-placeholder" />
                <div className="h-5 w-7 rounded-full bg-placeholder" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[168px] rounded-liquid bg-placeholder/50" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
