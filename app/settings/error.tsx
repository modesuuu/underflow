"use client";

import { RouteErrorState } from "@/components/ui/RouteStates";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState error={error} reset={reset} scope="Settings" />;
}
