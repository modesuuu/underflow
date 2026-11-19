"use client";

import { useMemo } from "react";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from "@/components/kibo-ui/contribution-graph";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { localeTag } from "@/lib/i18n/format";
import type { UserActivity } from "../types";

function levelOf(count: number): Activity["level"] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function dayKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * GitHub-style contribution graph for the profile Overview, rendered
 * with the vendored Kibo UI contribution-graph (user pick 2026-11-19):
 * one block per day over the last 182 days, weeks as columns starting
 * Sunday, month labels on top, intensity in the accent green, total
 * count and the Less/More legend in the footer. Counts come from
 * GET /api/users/:id/activity (posts, comments, projects created and
 * joined) — the Kibo example's generated sample data is NOT used.
 */
export function ActivityHeatmap({ activity }: { activity: UserActivity }) {
  const { t, lang } = useLanguage();

  const data = useMemo<Activity[]>(() => {
    const start = new Date(`${activity.since}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Activity[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = dayKey(cursor);
      const count = activity.days[key] ?? 0;
      days.push({ date: key, count, level: levelOf(count) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [activity]);

  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) =>
        new Intl.DateTimeFormat(localeTag(lang), { month: "short" }).format(
          new Date(2024, m, 1),
        ),
      ),
    [lang],
  );

  const formatDay = (iso: string) =>
    new Intl.DateTimeFormat(localeTag(lang), {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));

  return (
    <section
      aria-label={t("profile.activityHeading")}
      className="flex flex-col gap-4 rounded-2xl bg-bg p-5"
    >
      <h3 className="text-lg font-medium text-ink">
        {t("profile.activityHeading")}
      </h3>

      <ContributionGraph
        blockMargin={3}
        blockSize={11}
        className="w-full"
        data={data}
        labels={{
          months: monthLabels,
          legend: {
            less: t("profile.activityLess"),
            more: t("profile.activityMore"),
          },
        }}
        totalCount={activity.totals.total}
      >
        <ContributionGraphCalendar>
          {({ activity: day, dayIndex, weekIndex }) => (
            <g>
              <title>
                {t("profile.activityOnDay", {
                  count: day.count,
                  date: formatDay(day.date),
                })}
              </title>
              <ContributionGraphBlock
                activity={day}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
              />
            </g>
          )}
        </ContributionGraphCalendar>
        <ContributionGraphFooter>
          <ContributionGraphTotalCount>
            {({ totalCount }) => (
              <div className="text-muted">
                {t("profile.activityTitle", { count: totalCount })}
              </div>
            )}
          </ContributionGraphTotalCount>
          <ContributionGraphLegend />
        </ContributionGraphFooter>
      </ContributionGraph>
    </section>
  );
}
