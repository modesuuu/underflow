"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import { circleStatusKey } from "./statusLabel";

/**
 * Rows for owned projects that still have no Circle (the owner picked
 * "decide later" or an external link at creation time). Shared by the
 * Circle workspace empty state and the rail's create menu; creating
 * lands the user straight inside the new circle.
 */
export function CreateCircleRows({
  projects,
  creatingId,
  onCreate,
}: {
  projects: MyCollabProject[];
  creatingId: string | null;
  onCreate: (project: MyCollabProject) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-1">
      {projects.map((project) => (
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
            onClick={() => onCreate(project)}
            className="pressable shrink-0 cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingId === project.id
              ? t("circle.creating")
              : t("circle.createButton")}
          </button>
        </div>
      ))}
    </div>
  );
}
