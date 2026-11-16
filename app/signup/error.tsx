"use client";

import { RouteErrorState } from "@/components/ui/RouteStates";

export default function SignupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState error={error} reset={reset} scope="Signup" />;
}
