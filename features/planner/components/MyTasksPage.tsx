"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { backendErrorMessage } from "@/features/collaborations/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getMyTasks, updatePlannerTask } from "../api";
import { refreshMyTaskCount, subscribePlannerTasks } from "../store";
import type { MyTasksData, PlannerTask } from "../types";
import { TaskRow, addDays } from "./TaskRow";

/** Count-up for the stat cards (Talmo mechanic). Transform/opacity-free
 *  by nature (text), 650ms ease-out, skipped on reduced motion. */
function useCountUp(value: number): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (from === value) {
      setDisplay(value);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 650);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const display = useCountUp(value);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
      <span className="flex items-center gap-1.5 font-mono text-2xs font-medium uppercase tracking-wider text-muted">
        <Icon name={icon} size={13} />
        {label}
      </span>
      <span className="text-4xl font-medium leading-none text-ink">
        {display}
      </span>
    </div>
  );
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function MyTasksPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<MyTasksData | null>(null);
  const [failed, setFailed] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setData(await getMyTasks());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(
    () =>
      subscribePlannerTasks(() => {
        void refetch();
      }),
    [refetch]
  );

  useEffect(() => {
    const iv = window.setInterval(() => void refetch(), 30_000);
    return () => window.clearInterval(iv);
  }, [refetch]);

  const mergeTask = useCallback((task: PlannerTask) => {
    setData((d) =>
      d ? { ...d, tasks: d.tasks.map((x) => (x.id === task.id ? task : x)) } : d
    );
  }, []);

  const toggleDone = async (task: PlannerTask) => {
    try {
      const res = await updatePlannerTask(task.collabId, task.id, {
        done: !task.done,
      });
      mergeTask(res.task);
      void refreshMyTaskCount();
      void refetch();
    } catch (err) {
      toast.error(backendErrorMessage(err));
    }
  };

  const pushDay = async (task: PlannerTask) => {
    if (!task.dueDate) return;
    const oldDate = task.dueDate;
    try {
      const res = await updatePlannerTask(task.collabId, task.id, {
        dueDate: addDays(oldDate, 1),
      });
      mergeTask(res.task);
      if (res.shiftedTaskIds.length > 0) void refetch();
      toast.success(t("planner.dateMoved"), {
        description:
          res.shiftedTaskIds.length > 0
            ? t("planner.shiftedNotice", { n: res.shiftedTaskIds.length })
            : undefined,
        action: {
          label: t("planner.undo"),
          onClick: () => {
            void updatePlannerTask(task.collabId, task.id, {
              dueDate: oldDate,
            })
              .then((r) => {
                mergeTask(r.task);
                if (r.shiftedTaskIds.length > 0) void refetch();
              })
              .catch((err) => toast.error(backendErrorMessage(err)));
          },
        },
      });
    } catch (err) {
      toast.error(backendErrorMessage(err));
    }
  };

  if (data === null && failed) {
    return (
      <div className="flex flex-col gap-1.5">
        <h1 className="text-4xl font-medium text-ink">{t("tasks.title")}</h1>
        <p className="text-sm text-muted">{t("tasks.loadFailed")}</p>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="h-10 w-56 rounded-lg bg-placeholder" />
          <div className="h-4 w-72 rounded bg-placeholder" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-placeholder/60" />
          ))}
        </div>
        <div className="h-40 rounded-lg bg-placeholder/60" />
      </div>
    );
  }

  const today = data.today;
  // End of the current week (Sunday), computed from the server's today.
  const dow = new Date(`${today}T12:00:00`).getDay(); // 0 = Sunday
  const sunday = addDaysStr(today, dow === 0 ? 0 : 7 - dow);

  const open = data.tasks.filter((x) => !x.done);
  const nextUp = open.find((x) => x.dueDate !== null) ?? null;
  const groups: { key: string; label: string; tasks: PlannerTask[] }[] = [
    {
      key: "overdue",
      label: t("tasks.groupOverdue"),
      tasks: open.filter((x) => x.dueDate !== null && x.dueDate < today),
    },
    {
      key: "today",
      label: t("tasks.groupToday"),
      tasks: open.filter((x) => x.dueDate === today),
    },
    {
      key: "week",
      label: t("tasks.groupWeek"),
      tasks: open.filter(
        (x) => x.dueDate !== null && x.dueDate > today && x.dueDate <= sunday
      ),
    },
    {
      key: "later",
      label: t("tasks.groupLater"),
      tasks: open.filter((x) => x.dueDate !== null && x.dueDate > sunday),
    },
    {
      key: "nodate",
      label: t("tasks.groupNoDate"),
      tasks: open.filter((x) => x.dueDate === null),
    },
    {
      key: "done",
      label: t("tasks.groupDone"),
      tasks: data.tasks.filter((x) => x.done),
    },
  ];

  const rowFor = (task: PlannerTask) => (
    <TaskRow
      key={task.id}
      task={task}
      today={today}
      canToggle
      canPush
      canEdit={false}
      canDelete={false}
      onToggleDone={(x) => void toggleDone(x)}
      onPushDay={(x) => void pushDay(x)}
      onEdit={() => undefined}
      onDelete={() => undefined}
      collabHref={`/collaborations/${task.collabId}`}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-4xl font-medium text-ink">{t("tasks.title")}</h1>
        <p className="text-sm text-muted">{t("tasks.subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("tasks.statOpen")} value={data.counts.open} icon="task" />
        <StatCard label={t("tasks.statOverdue")} value={data.counts.overdue} icon="alarm" />
        <StatCard label={t("tasks.statDoneWeek")} value={data.counts.doneThisWeek} icon="check-circle" />
      </div>

      {nextUp && (
        <div className="flex flex-col gap-3 rounded-lg bg-ink p-5 text-surface">
          <span className="font-mono text-2xs font-medium uppercase tracking-wider opacity-70">
            {t("tasks.nextUp")}
          </span>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-lg font-medium">{nextUp.title}</span>
              <span className="flex items-center gap-3 text-xs opacity-80">
                {nextUp.collabTitle && (
                  <Link
                    href={`/collaborations/${nextUp.collabId}`}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Icon name="group" size={12} />
                    {nextUp.collabTitle}
                  </Link>
                )}
                {nextUp.dueDate && (
                  <span className="flex items-center gap-1">
                    <Icon name="calendar" size={12} />
                    {nextUp.dueDate < today
                      ? t("planner.overdue")
                      : nextUp.dueDate === today
                        ? t("planner.today")
                        : nextUp.dueDate}
                  </span>
                )}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {nextUp.dueDate && (
                <button
                  type="button"
                  onClick={() => void pushDay(nextUp)}
                  className="cursor-pointer rounded-full border border-surface/40 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-surface/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
                >
                  {t("planner.pushOneDay")}
                </button>
              )}
              <button
                type="button"
                onClick={() => void toggleDone(nextUp)}
                className="cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
              >
                {t("planner.markDone")}
              </button>
            </div>
          </div>
        </div>
      )}

      {failed && (
        <p className="text-sm text-muted">{t("tasks.loadFailed")}</p>
      )}

      {open.length === 0 && data.tasks.every((x) => !x.done) ? (
        <div className="flex flex-col items-center gap-1.5 py-10 text-center">
          <span className="text-base font-medium text-ink">
            {t("tasks.emptyTitle")}
          </span>
          <span className="max-w-md text-sm text-muted">
            {t("tasks.emptyBody")}
          </span>
        </div>
      ) : (
        groups
          .filter((g) => g.tasks.length > 0)
          .map((g) => (
            <div key={g.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 px-2">
                <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                  {g.label}
                </span>
                <span className="text-2xs text-muted">{g.tasks.length}</span>
              </div>
              <div className="flex flex-col rounded-lg border border-line bg-surface px-2 py-1">
                {g.tasks.map(rowFor)}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
