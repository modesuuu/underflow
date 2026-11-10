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
import { MyCollabBoard } from "./MyCollabBoard";
import type { MyCollabProject } from "../types";

export function MyCollabBoardLoader({ fallback }: { fallback: ReactNode }) {
  const [projects, setProjects] = useState<MyCollabProject[] | null>(null);
  const [failed, setFailed] = useState(false);

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
  }, []);

  if (failed) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6">
        <p className="text-base font-semibold">Something went wrong</p>
        <p className="text-sm text-muted">
          We couldn&apos;t load your collaborations. This is usually a
          temporary glitch — give it another try.
        </p>
      </div>
    );
  }
  if (projects === null) return <>{fallback}</>;
  return <MyCollabBoard projects={projects} />;
}
