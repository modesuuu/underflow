"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { getCircle } from "@/features/circle/api";

/**
 * /circle/:projectId just routes into the room: it loads the circle
 * (client-side — the project list needs the session token) and
 * replaces into /general, or 404s when the project has no Circle.
 */
export default function CircleProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCircle(projectId).then((circle) => {
      if (cancelled) return;
      if (!circle) setExists(false);
      else router.replace(`/circle/${projectId}/general`);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, router]);
  if (exists === false) notFound();
  return null;
}
