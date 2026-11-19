"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { localeTag } from "@/lib/i18n/format";
import type { UserActivity } from "../types";

const LEVEL_CLASS = [
  "bg-line/40",
  "bg-accent/30",
  "bg-accent/55",
  "bg-accent/80",
  "bg-accent",
] as const;

function levelOf(count: number): number {
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

interface DayCell {
  key: string;
  count: number;
  label: string;
}

/**
 * GitHub-style contribution graph for the profile Overview: one
 * cell per day over the last 182 days, weeks as columns starting
 * Sunday, month labels on top, intensity in the accent green.
 * Counts come from GET /api/users/:id/activity (posts, comments,
 * projects created and joined).
 */
export function ActivityHeatmap({ activity }: { activity: UserActivity }) {
  const { t, lang } = useLanguage();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 181);
  start.setDate(start.getDate() - start.getDay());

  const weeks: DayCell[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const key = dayKey(cursor);
      week.push({
        key,
        count: activity.days[key] ?? 0,
        label: new Intl.DateTimeFormat(localeTag(lang), {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(cursor),
      });
      cursor.setDate(cursor.getDate() + 1);
      if (cursor > today) {
        // Pad the trailing week so every column has seven rows.
        while (week.length < 7) week.push({ key: `pad-${week.length}`, count: -1, label: "" });
        break;
      }
    }
    weeks.push(week);
  }

  const monthOf = (week: DayCell[]) => {
    const first = week.find((c) => c.count >= 0);
    if (!first) return "";
    return new Intl.DateTimeFormat(localeTag(lang), { month: "short" }).format(
      new Date(`${first.key}T00:00:00`),
    );
  };

  return (
    <section
      aria-label={t("profile.activityHeading")}
      className="flex flex-col gap-4 rounded-2xl bg-bg p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium text-ink">
          {t("profile.activityHeading")}
        </h3>
        <p className="text-sm text-muted">
          {t("profile.activityTitle", { count: activity.totals.total })}
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              <span className="h-3 text-[9px] leading-3 text-muted">
                {wi === 0 || monthOf(week) !== monthOf(weeks[wi - 1])
                  ? monthOf(week)
                  : ""}
              </span>
              {week.map((cell) =>
                cell.count < 0 ? (
                  <span key={cell.key} className="size-2.5" />
                ) : (
                  <span
                    key={cell.key}
                    title={t("profile.activityOnDay", {
                      count: cell.count,
                      date: cell.label,
                    })}
                    className={`size-2.5 rounded-[2px] ${LEVEL_CLASS[levelOf(cell.count)]}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted">
        <span>{t("profile.activityLess")}</span>
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={`size-2.5 rounded-[2px] ${cls}`} />
        ))}
        <span>{t("profile.activityMore")}</span>
      </div>
    </section>
  );
}
