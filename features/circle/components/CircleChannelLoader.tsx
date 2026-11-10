"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCircleProjects } from "../api";
import { CircleShell } from "./CircleShell";
import type { ChannelId, CircleProjectSummary } from "../types";

/**
 * /circle/:projectId/:channelId loader: the project summary (title,
 * status label) needs the session Bearer token, so it loads client-side.
 * The room itself (messages/members) comes from the Circle store.
 */
export function CircleChannelLoader({
  projectId,
  channelId,
}: {
  projectId: string;
  channelId: ChannelId;
}) {
  const [summary, setSummary] = useState<CircleProjectSummary | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getCircleProjects()
      .then((projects) => {
        if (cancelled) return;
        const found = projects.find((p) => p.projectId === projectId);
        if (!found) setMissing(true);
        else setSummary(found);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  if (missing) notFound();
  if (!summary) return null;
  return (
    <AppShell
      fill
      breadcrumbRoot="Dashboard / Circle"
      breadcrumbLeaf={summary.title}
      backLabel="Circles"
      backHref="/circle"
      variant="detail"
    >
      <CircleShell
        projectId={projectId}
        channelId={channelId}
        title={summary.title}
        statusLabel={summary.statusLabel}
      />
    </AppShell>
  );
}
