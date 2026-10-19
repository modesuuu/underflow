import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

/**
 * Loading skeleton for /my-collaborations/[category] — shaped
 * like the category page: pill + title + subtitle header, a
 * search-first toolbar, and a hairline row list. Loading
 * receives no params, so the labels are generic by design.
 */
export default function MyCollabCategoryLoading() {
  return (
    <AppShell
      backLabel="My Collaborations"
      backHref="/my-collaborations"
      breadcrumbRoot="Tools"
      breadcrumbLeaf="Category"
      actions={<NotificationsBell />}
    >
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3">
          <div className="h-6 w-32 rounded-full bg-placeholder" />
          <div className="h-8 w-56 rounded-lg bg-placeholder" />
          <div className="h-4 w-64 rounded-md bg-placeholder" />
        </div>

        {/* Toolbar: search-first */}
        <div className="flex items-center gap-3">
          <div className="h-11 flex-1 rounded-xl border border-line bg-surface sm:max-w-md" />
          <div className="h-11 w-24 rounded-xl bg-placeholder" />
          <div className="ms-auto flex items-center gap-2">
            <div className="h-11 w-32 rounded-xl bg-placeholder" />
            <div className="h-11 w-28 rounded-xl bg-placeholder" />
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col divide-y divide-line/50 border-y border-line/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 py-3">
              <div className="h-4 w-1/3 rounded bg-placeholder" />
              <div className="h-3 w-1/4 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
