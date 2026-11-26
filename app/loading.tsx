import { RouteLoading } from "@/components/ui/RouteStates";

/**
 * Root loading fallback: every route without its own loading.tsx
 * (home feed, tasks, profile, search, static pages) shows the
 * shared loading animation while the segment renders.
 */
export default function RootLoading() {
  return <RouteLoading />;
}
