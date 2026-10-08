import { AppShell } from "@/components/layout/AppShell";

/**
 * P1-B #15: detail-shaped skeleton while getCollabProject() suspends.
 * Mirrors the CollabDetailContent section order: header band (status pill,
 * title, meta row, 2×2 photos), owner card (avatar + about + work items),
 * skill pills, team row, and the bottom Apply CTA block.
 */
export default function CollabDetailLoading() {
  return (
    <AppShell variant="detail" backLabel="Collaborations" backHref="/collaborations">
      <div className="flex flex-col gap-6 px-6 pb-12 pt-6">
        {/* Header band */}
        <div className="flex flex-col gap-4 rounded-2xl p-6">
          <div className="h-6 w-24 rounded-full bg-bg" />
          <div className="h-10 w-2/3 rounded bg-placeholder" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 rounded bg-placeholder" />
            <div className="h-4 w-24 rounded bg-placeholder" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-md bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* Owner card */}
        <div className="flex flex-col gap-4 rounded-2xl bg-bg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-[42px] rounded-full bg-placeholder" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 rounded bg-placeholder" />
                <div className="h-3 w-20 rounded bg-placeholder" />
              </div>
            </div>
            <div className="h-9 w-36 rounded-full bg-placeholder" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 rounded bg-placeholder" />
            <div className="h-3.5 w-full rounded bg-placeholder/70" />
            <div className="h-3.5 w-4/5 rounded bg-placeholder/70" />
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-3">
          <div className="h-6 w-40 rounded bg-placeholder" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-28 rounded-full bg-placeholder/60" />
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 rounded bg-placeholder" />
            <div className="h-4 w-14 rounded bg-placeholder" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-placeholder" />
                <div className="flex flex-col gap-1">
                  <div className="h-3.5 w-20 rounded bg-placeholder" />
                  <div className="h-3 w-14 rounded bg-placeholder/70" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="flex items-center justify-center rounded-2xl bg-bg p-6">
          <div className="h-12 w-44 rounded-md bg-placeholder" />
        </div>
      </div>
    </AppShell>
  );
}
