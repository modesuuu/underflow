"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useSessionUser } from "@/features/auth/store";
import { backendErrorMessage } from "@/features/collaborations/api";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import { createCircle, getCircles } from "../api";
import { CircleIndexList } from "./CircleIndexList";
import { circleStatusKey } from "./statusLabel";
import type { CircleSummary } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * /circle index (Circle Phase 1): the circles the user can access,
 * plus — for owners who picked "decide later" or an external link at
 * creation time — their projects that still have no Circle, each with
 * a create action that lands straight inside the new circle.
 */
export function CircleIndexLoader() {
  const { t } = useLanguage();
  const router = useRouter();
  const sessionUser = useSessionUser();
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [withoutCircle, setWithoutCircle] = useState<MyCollabProject[]>([]);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCircles()
      .then((rows) => {
        if (!cancelled) setCircles(rows);
      })
      .catch(() => {
        if (!cancelled) setCircles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionUser) return;
    let cancelled = false;
    getMyCollabProjects()
      .then((projects) => {
        if (cancelled) return;
        setWithoutCircle(
          projects.filter(
            (p) =>
              p.owner.id === sessionUser.id &&
              !p.circleId &&
              p.myStatus !== "pending"
          )
        );
      })
      .catch(() => {
        // The section simply stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  const handleCreate = async (project: MyCollabProject) => {
    setCreatingId(project.id);
    try {
      const detail = await createCircle(project.id);
      router.push(`/circle/${detail.id}`);
    } catch (err) {
      toast.error(backendErrorMessage(err));
      setCreatingId(null);
    }
  };

  return (
    <AppShell breadcrumbRoot="Dashboard" breadcrumbLeaf="Circle">
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-6 lg:mx-0 lg:ml-[28px] lg:px-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {t("circle.title")}
          </h1>
          <p className="text-base text-muted">{t("circle.indexSubtitle")}</p>
        </div>
        {circles === null ? null : <CircleIndexList circles={circles} />}
        {withoutCircle.length > 0 && (
          <div className="flex flex-col gap-1 pt-2">
            <h2 className="pb-1 text-base font-semibold text-ink">
              {t("circle.withoutCircleTitle")}
            </h2>
            {withoutCircle.map((project) => (
              <div key={project.id} className="flex items-center gap-3 py-2">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-medium text-ink">
                    {project.title}
                  </span>
                  <span className="text-sm text-muted">
                    {t(circleStatusKey(project.status))}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={creatingId === project.id}
                  onClick={() => handleCreate(project)}
                  className="pressable shrink-0 cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingId === project.id
                    ? t("circle.creating")
                    : t("circle.createButton")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
