"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { getMyCollabProject } from "../api";
import type { MyCollabCategory, MyCollabProject } from "../types";
import { MyCollabDetailContent } from "./MyCollabDetailContent";
import { MyCollabLoadError } from "./MyCollabLoadError";

/**
 * Client-side loader for the My Collaborations detail page.
 *
 * The project is user-scoped and the session token lives in
 * localStorage — client-only — so the page cannot fetch it on
 * the server (a server fetch sends no token, the backend
 * answers 403, and the route error boundary renders; the
 * board hit the same wall, see MyCollabBoardLoader). The
 * AppShell lives here rather than in the page because its
 * breadcrumb leaf is the project title, a data-bound value.
 *
 * A project that is not in the user's list, or whose myStatus
 * does not match the URL category, is a 404 — the same rule
 * the old server-side fetch enforced.
 */
export function MyCollabDetailLoader({
  category,
  projectId,
  fallback,
}: {
  category: MyCollabCategory;
  projectId: string;
  fallback: ReactNode;
}) {
  const [project, setProject] = useState<MyCollabProject | null | undefined>(
    undefined
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getMyCollabProject(projectId)
      .then((p) => {
        if (alive) setProject(p ?? null);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [projectId, attempt]);

  if (failed) {
    return (
      <AppShell
        variant="detail"
        backLabel={category.crumbLabel}
        backHref={`/my-collaborations/${category.slug}`}
        breadcrumbRoot={`Tools / My Collaborations / ${category.crumbLabel}`}
        breadcrumbLeaf={category.crumbLabel}
        panel={<NotificationsPanel className="px-6" />}
      >
        <div className="px-4 py-6 sm:px-6">
          <MyCollabLoadError
            onRetry={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
          />
        </div>
      </AppShell>
    );
  }
  if (project === undefined) return <>{fallback}</>;
  if (project === null || project.myStatus !== category.slug) notFound();

  return (
    <AppShell
      variant="detail"
      backLabel={category.crumbLabel}
      backHref={`/my-collaborations/${category.slug}`}
      breadcrumbRoot={`Tools / My Collaborations / ${category.crumbLabel}`}
      breadcrumbLeaf={project.title}
      panel={<NotificationsPanel className="px-6" />}
    >
      <MyCollabDetailContent project={project} />
    </AppShell>
  );
}
