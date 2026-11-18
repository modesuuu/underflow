"use client";

import { useEffect } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { getCircleDetail } from "@/features/circle/api";

/**
 * /circle/:circleId lands on the circle's first zone (announcements —
 * the backend orders it first). Unknown ids and circles the user
 * cannot access render the not-found page.
 */
export default function CircleHomePage() {
  const params = useParams<{ circleId: string }>();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getCircleDetail(params.circleId)
      .then((detail) => {
        if (cancelled) return;
        const first = detail.zones[0];
        if (first) router.replace(`/circle/${detail.id}/${first.id}`);
      })
      .catch(() => {
        if (!cancelled) notFound();
      });
    return () => {
      cancelled = true;
    };
  }, [params.circleId, router]);

  return null;
}
