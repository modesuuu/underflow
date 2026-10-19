/**
 * Skeleton for the desktop notifications panel (xl and up), shaped
 * like NotificationsPanel: title row, tab pill, then four
 * avatar + two-line rows with hairline dividers. Used by the
 * route-level loading.tsx files of the pages that carry the panel,
 * so the 308px column is present from the first loading frame
 * instead of arriving together with the content. AppShell renders
 * the panel aside only at xl, so nothing changes below that.
 */
const ROWS = [
  { name: "w-24", sub: "w-40" },
  { name: "w-20", sub: "w-32" },
  { name: "w-28", sub: "w-36" },
  { name: "w-16", sub: "w-28" },
];

export function NotificationsPanelSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-28 rounded bg-placeholder" />
        <div className="h-9 rounded-full bg-bg" />
      </div>

      <div className="flex flex-col gap-4">
        {ROWS.map((row, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="size-8 shrink-0 rounded-full bg-placeholder" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                <div className={"h-3.5 rounded bg-placeholder " + row.name} />
                <div className={"h-3 rounded bg-placeholder/70 " + row.sub} />
              </div>
            </div>
            {i < ROWS.length - 1 && (
              <div className="h-px w-full bg-placeholder" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
