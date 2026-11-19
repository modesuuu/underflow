"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const BLOCK_MARGIN = 3;
const MIN_BLOCK = 10;
const MAX_BLOCK = 30;
// The vendored graph's label band height (its default fontSize 14
// + 8 margin) — the hover tooltip anchors to block coordinates in
// the same unit space.
const LABEL_HEIGHT = 22;

// useLayoutEffect without the SSR warning (this component still
// server-renders its shell).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Fluid block size: the graph spans the full card width instead of
 * sitting at its natural ~360px, so the block size is derived from
 * the measured container width and the week count, and re-derived
 * whenever the container resizes (window, sidebar collapse).
 */
function useBlockSize(weekCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [blockSize, setBlockSize] = useState(MIN_BLOCK);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || weekCount === 0) return;
    const update = () => {
      const w = el.clientWidth;
      if (w === 0) return;
      const size = Math.floor((w + BLOCK_MARGIN) / weekCount) - BLOCK_MARGIN;
      setBlockSize(Math.min(MAX_BLOCK, Math.max(MIN_BLOCK, size)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weekCount]);

  return { ref, blockSize };
}

/**
 * GitHub-style contribution graph for the profile Overview, rendered
 * with the vendored Kibo UI contribution-graph (user pick 2026-11-19):
 * one block per day over the last 365 days, weeks as columns starting
 * Sunday, month labels on top, intensity in the accent green, total
 * count and the Less/More legend in the footer. The block size is
 * fluid so the graph always spans the full card width, and hovering
 * a block shows a GitHub-style animated tooltip above it. Counts come
 * from GET /api/users/:id/activity (posts, comments, projects
 * created and joined) — the Kibo example's generated sample data is
 * NOT used.
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

  // Weeks the graph will render: the day cells plus the leading pad
  // up to the previous Sunday (the graph starts weeks on Sunday).
  const weekCount = useMemo(() => {
    if (data.length === 0) return 0;
    const pad = new Date(`${data[0].date}T00:00:00`).getDay();
    return Math.ceil((pad + data.length) / 7);
  }, [data]);
  const { ref: graphRef, blockSize } = useBlockSize(weekCount);

  // GitHub-style hover: one tooltip that appears above the hovered
  // block and glides from cell to cell while the pointer moves.
  const [hover, setHover] = useState<{
    weekIndex: number;
    dayIndex: number;
    count: number;
    date: string;
  } | null>(null);

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

      <div
        ref={graphRef}
        className="relative"
        onMouseLeave={() => setHover(null)}
      >
        <ContributionGraph
          blockMargin={BLOCK_MARGIN}
          blockSize={blockSize}
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
              <g
                onMouseEnter={() =>
                  setHover({
                    weekIndex,
                    dayIndex,
                    count: day.count,
                    date: day.date,
                  })
                }
              >
                <ContributionGraphBlock
                  activity={day}
                  dayIndex={dayIndex}
                  weekIndex={weekIndex}
                  className={
                    hover?.weekIndex === weekIndex &&
                    hover?.dayIndex === dayIndex
                      ? "stroke-ink/60 [stroke-width:1.5px]"
                      : undefined
                  }
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
        {hover && (
          <div
            aria-hidden="true"
            className="uf-graph-tip pointer-events-none absolute z-10 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-bg shadow-lg"
            style={{
              left: `clamp(86px, ${
                (blockSize + BLOCK_MARGIN) * hover.weekIndex + blockSize / 2
              }px, calc(100% - 86px))`,
              top:
                LABEL_HEIGHT + (blockSize + BLOCK_MARGIN) * hover.dayIndex,
            }}
          >
            {t("profile.activityOnDay", {
              count: hover.count,
              date: formatDay(hover.date),
            })}
          </div>
        )}
      </div>
    </section>
  );
}
