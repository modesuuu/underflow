"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ProfileStats } from "../types";

const TICKS = 44;

/**
 * Stats band of the profile Overview, following the reference
 * layout: two white cards on a flat gray band. Left card is the
 * project completion percentage over a dotted tick track (filled
 * ticks in the accent color); right card is the post count with
 * the active / complete project figures underneath. Both cards
 * keep their View detail links to the Posts / Projects pages.
 */
export function PerformanceSummary({
  personId,
  stats,
}: {
  personId: string;
  stats: ProfileStats;
}) {
  const { t } = useLanguage();
  const total = stats.completeProjects + stats.activeProjects;
  const pct = total > 0 ? Math.round((stats.completeProjects / total) * 100) : 0;
  const filled = Math.round((pct / 100) * TICKS);

  return (
    <section
      aria-label={t("profile.performanceSummary")}
      className="rounded-3xl bg-bg p-3 sm:p-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-medium text-ink">
              {t("profile.projectCompletion")}
            </h3>
            <p className="text-[28px] font-semibold leading-none text-ink">
              {pct}
              <span className="text-base font-medium text-muted">%</span>
            </p>
          </div>
          <div className="flex items-end gap-[3px]" aria-hidden="true">
            {Array.from({ length: TICKS }).map((_, i) => (
              <span
                key={i}
                className={`h-4 flex-1 rounded-full ${i < filled ? "bg-accent" : "bg-line/50"}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {total > 0
                ? t("profile.completedOfTotal", {
                    complete: stats.completeProjects,
                    total,
                  })
                : t("profile.noProjectsYet")}
            </p>
            <Link
              href={`/profile/${personId}/projects`}
              className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-ink hover:underline"
            >
              {t("profile.viewDetail")}
              <Icon name="chevron-right" size={16} />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-medium text-ink">
              {t("profile.postFeed")}
            </h3>
            <Link
              href={`/profile/${personId}/posts`}
              className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-ink hover:underline"
            >
              {t("profile.viewDetail")}
              <Icon name="chevron-right" size={16} />
            </Link>
          </div>
          <p className="text-[40px] font-semibold leading-none text-accent">
            {stats.postFeed}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
            <span>
              {t("profile.activeProjects")}:{" "}
              <span className="font-medium text-ink">{stats.activeProjects}</span>
            </span>
            <span>
              {t("profile.completeProjects")}:{" "}
              <span className="font-medium text-ink">
                {stats.completeProjects}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
