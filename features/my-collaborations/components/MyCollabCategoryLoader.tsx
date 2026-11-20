"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getMyCollabProjects } from "../api";
import { myCollabCategorySlice } from "../columns";
import { useSessionUser } from "@/features/auth/store";
import type { MyCollabCategorySlug, MyCollabProject } from "../types";
import { MyCollabCategoryGrid } from "./MyCollabCategoryGrid";
import { MyCollabLoadError } from "./MyCollabLoadError";

/**
 * Client-side loader for one My Collaborations category page.
 *
 * The list is user-scoped (GET /api/my-collaborations needs the
 * session token), and the token lives in localStorage —
 * client-only — so the page cannot fetch it on the server: a
 * server fetch sends no token, the backend answers 403, and
 * the route error boundary renders. The board hit the same
 * wall and got MyCollabBoardLoader; this is its category twin.
 * Filtering by status and the board's global pastel offset are
 * computed here from the one list fetch, unchanged.
 */
export function MyCollabCategoryLoader({
  status,
  fallback,
}: {
  status: MyCollabCategorySlug;
  fallback: ReactNode;
}) {
  const sessionUser = useSessionUser();
  const [data, setData] = useState<{
    projects: MyCollabProject[];
    startIndex: number;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getMyCollabProjects()
      .then((all) => {
        if (!alive) return;
        // Board categories reuse the board's partition (same
        // lists, same global tint offsets); see ../columns.
        setData(myCollabCategorySlice(all, sessionUser?.id ?? null, status));
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [status, attempt, sessionUser]);

  if (failed) {
    return (
      <MyCollabLoadError
        onRetry={() => {
          setFailed(false);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }
  if (data === null) return <>{fallback}</>;
  return (
    <MyCollabCategoryGrid
      projects={data.projects}
      startIndex={data.startIndex}
    />
  );
}
