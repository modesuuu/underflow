"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PlannerTask } from "../types";

export function formatDueLabel(dueDate: string, lang: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function addDays(dueDate: string, days: number): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface TaskRowProps {
  task: PlannerTask;
  /** Server today (YYYY-MM-DD) for overdue/today colouring. */
  today: string;
  canToggle: boolean;
  canPush: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggleDone: (task: PlannerTask) => void;
  onPushDay: (task: PlannerTask) => void;
  onEdit: (task: PlannerTask) => void;
  onDelete: (task: PlannerTask) => void;
  /** Global page only: link chip to the owning collab. */
  collabHref?: string;
}

export function TaskRow({
  task,
  today,
  canToggle,
  canPush,
  canEdit,
  canDelete,
  onToggleDone,
  onPushDay,
  onEdit,
  onDelete,
  collabHref,
}: TaskRowProps) {
  const { t, lang } = useLanguage();
  const overdue = !task.done && task.dueDate !== null && task.dueDate < today;
  const isToday = !task.done && task.dueDate === today;

  return (
    <div className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-bg">
      <button
        type="button"
        disabled={!canToggle}
        onClick={() => onToggleDone(task)}
        aria-label={task.title}
        className={`mt-0.5 flex size-[20px] shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          task.done
            ? "border-accent bg-accent text-on-accent"
            : "border-line bg-surface text-transparent hover:border-accent"
        } ${canToggle ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
      >
        <Icon name="check" size={12} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`text-sm leading-snug ${
            task.done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-2xs font-medium ${
                overdue ? "text-badge" : isToday ? "font-semibold text-ink" : "text-muted"
              }`}
            >
              <Icon name="calendar" size={12} />
              {formatDueLabel(task.dueDate, lang)}
              {overdue && <span>· {t("planner.overdue")}</span>}
              {isToday && <span>· {t("planner.today")}</span>}
            </span>
          )}
          {task.follows && (
            <span className="flex items-center gap-1 text-2xs text-muted">
              <Icon name="subdirectory-right" size={12} />
              {t("planner.followsChip", { title: task.follows.title })}
              {task.gapDays !== null && task.gapDays !== 0 && (
                <span>
                  ·{" "}
                  {task.gapDays > 0
                    ? t("planner.gapAfter", { n: task.gapDays })
                    : t("planner.gapBefore", { n: Math.abs(task.gapDays) })}
                </span>
              )}
            </span>
          )}
          {collabHref && task.collabTitle && (
            <Link
              href={collabHref}
              className="flex items-center gap-1 text-2xs font-medium text-muted transition-colors hover:text-ink"
            >
              <Icon name="group" size={12} />
              {task.collabTitle}
            </Link>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {(canPush || canEdit || canDelete) && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {canPush && task.dueDate && !task.done && (
              <button
                type="button"
                onClick={() => onPushDay(task)}
                className="cursor-pointer rounded-full border border-line bg-surface px-2 py-1 text-2xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t("planner.pushOneDay")}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={t("planner.editTask")}
                className="flex cursor-pointer items-center justify-center rounded-full border border-line bg-surface p-1.5 text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon name="edit" size={13} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={t("common.delete")}
                className="flex cursor-pointer items-center justify-center rounded-full border border-line bg-surface p-1.5 text-badge transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon name="trash" size={13} />
              </button>
            )}
          </div>
        )}
        {task.assignee && (
          <span title={task.assignee.name}>
            <Avatar size={24} src={task.assignee.photo ?? undefined} alt={task.assignee.name} />
          </span>
        )}
      </div>
    </div>
  );
}
