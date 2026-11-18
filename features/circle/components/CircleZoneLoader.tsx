"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ApiError } from "@/lib/api-client";
import { getCircleDetail } from "../api";
import { circleStatusKey } from "./statusLabel";
import { CircleShell } from "./CircleShell";
import type { CircleDetail } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Loads one Circle by its own id (Phase 1 routes are keyed by
 * circle.id, not the collaboration id). A 403/404 — not a member, or
 * no such circle — renders the app's not-found page; a zone id that
 * is not part of this circle does the same.
 */
export function CircleZoneLoader({
  circleId,
  zoneId,
}: {
  circleId: string;
  zoneId: string;
}) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState<CircleDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCircleDetail(circleId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.status === 403 || err.status === 404)
        ) {
          setMissing(true);
        } else {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [circleId]);

  if (missing) notFound();
  if (detail && !detail.zones.some((z) => z.id === zoneId)) notFound();

  return (
    <AppShell
      fill
      breadcrumbRoot="Dashboard / Circle"
      breadcrumbLeaf={detail?.title ?? "Circle"}
      backLabel="Circles"
      backHref="/circle"
      variant="detail"
    >
      {detail ? (
        <CircleShell
          detail={detail}
          zoneId={zoneId}
          statusLabel={t(circleStatusKey(detail.status))}
        />
      ) : loadError ? (
        <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-muted">
          {t("circle.loadError")}
        </div>
      ) : null}
    </AppShell>
  );
}
