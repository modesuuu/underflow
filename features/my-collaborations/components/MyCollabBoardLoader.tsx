// Client-side loader for the My Collaborations board.
//
// The board's data is user-scoped (GET /api/my-collaborations needs the
// Bearer token), and the token lives in localStorage — client-only.
// The page is a server component, so it cannot send the token; a
// server-side fetch 401s and the page's error boundary renders.
// This loader fetches from the client after mount (where the token is
// available) and shows the same skeleton while loading.
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getMyCollabProjects } from "../api";
import { useSessionUser } from "@/features/auth/store";
import { MyCollabBoard } from "./MyCollabBoard";
import { MyCollabLoadError } from "./MyCollabLoadError";
import type { MyCollabProject } from "../types";

export function MyCollabBoardLoader({ fallback }: { fallback: ReactNode }) {
  const sessionUser = useSessionUser();
  const [projects, setProjects] = useState<MyCollabProject[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getMyCollabProjects()
      .then((p) => {
        if (alive) setProjects(p);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

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
  if (projects === null || sessionUser === null) return <>{fallback}</>;
  return <MyCollabBoard projects={projects} myUserId={sessionUser.id} />;
}
