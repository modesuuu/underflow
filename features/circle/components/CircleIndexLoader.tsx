"use client";

import { useEffect, useState } from "react";
import { getCircleProjects } from "../api";
import { CircleIndexList } from "./CircleIndexList";
import type { CircleProjectSummary } from "../types";

/**
 * /circle index loader: the project list needs the session Bearer
 * token, so it loads client-side (the server cannot fetch it).
 */
export function CircleIndexLoader() {
  const [projects, setProjects] = useState<CircleProjectSummary[] | null>(
    null,
  );
  useEffect(() => {
    let cancelled = false;
    getCircleProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (projects === null) {
    return <p className="py-10 text-sm text-muted">Loading circles…</p>;
  }
  return <CircleIndexList projects={projects} />;
}
