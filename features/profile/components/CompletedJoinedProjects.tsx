"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { CollabProject } from "@/features/collaborations/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Completed collaborations the person joined but does not own, shown
 * on the profile Overview below New Projects (user decision
 * 2026-11-19): finished teamwork on other people's projects, with
 * the owner credited on each card. Renders nothing when the person
 * has no completed joined projects.
 */
export function CompletedJoinedProjects({
  projects,
}: {
  projects: CollabProject[];
}) {
  const { t } = useLanguage();
  const sorted = [...projects]
    .sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))
    .slice(0, 6);
  if (sorted.length === 0) return null;

  return (
    <section
      aria-label={t("profile.completedCollabs")}
      className="flex flex-col gap-4 rounded-2xl bg-bg p-5"
    >
      <h3 className="text-lg font-medium text-ink">
        {t("profile.completedCollabs")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((project) => (
          <Link
            key={project.id}
            href={`/collaborations/${project.id}`}
            className="flex flex-col gap-2 rounded-md border border-transparent bg-surface p-4 transition-colors hover:border-line"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-snug text-ink">
                {project.title}
              </span>
              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                {t("collab.statusCompleted")}
              </span>
            </span>
            <span className="text-xs text-muted">
              {t("profile.projectBy", { name: project.owner.name })}
            </span>
            <span className="line-clamp-2 text-sm text-muted">
              {project.description || project.subtitle}
            </span>
            <span className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted">
              <Icon name="group" size={14} />
              {t("profile.membersCount", {
                filled: project.slotsFilled,
                total: project.slotsTotal,
              })}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
