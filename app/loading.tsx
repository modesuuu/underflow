import { AppShell } from "@/components/layout/AppShell";

/**
 * Universal fallback loading skeleton. This file is the root loading
 * boundary, so during a slow navigation it is the FIRST thing rendered for
 * any route whose own payload has not arrived yet. It must therefore not
 * mimic any particular page (it used to impersonate the feed — post cards +
 * notifications panel — and flashed on every sidebar navigation). Per-route
 * loading.tsx files provide the page-shaped skeletons once their payload
 * lands. Content here is intentionally generic: a title bar + neutral rows.
 */
export default function RootLoading() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full flex-col gap-6 px-12 py-8">
        <div className="h-9 w-64 rounded-lg bg-placeholder" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-full rounded-xl border border-line bg-surface"
          />
        ))}
      </div>
    </AppShell>
  );
}
