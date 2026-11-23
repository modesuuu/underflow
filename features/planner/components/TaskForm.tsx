"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type {
  PlannerMember,
  PlannerSection,
  PlannerTask,
  TaskInput,
  TaskUpdate,
} from "../types";

interface TaskFormProps {
  /** Task being edited, or null when creating. */
  task: PlannerTask | null;
  members: PlannerMember[];
  sections: PlannerSection[];
  tasks: PlannerTask[];
  meId: string;
  /** Owner / PM: may assign to others and manage meta fields. */
  canManage: boolean;
  /** Creator / owner: may edit title + section. */
  allowMeta: boolean;
  /** Assignee / owner / PM: may edit date + relation. */
  allowSchedule: boolean;
  defaultSectionId: string | null;
  busy: boolean;
  onSubmit: (payload: TaskInput | TaskUpdate) => void;
  onCancel: () => void;
}

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const labelCls =
  "font-mono text-2xs font-medium uppercase tracking-wider text-muted";

export function TaskForm({
  task,
  members,
  sections,
  tasks,
  meId,
  canManage,
  allowMeta,
  allowSchedule,
  defaultSectionId,
  busy,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(task?.title ?? "");
  const [assigneeId, setAssigneeId] = useState<string>(
    task?.assignee?.id ?? meId
  );
  const [sectionId, setSectionId] = useState<string>(
    task?.sectionId ?? defaultSectionId ?? ""
  );
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ?? "");
  const [followsId, setFollowsId] = useState<string>(task?.follows?.id ?? "");

  const leader = useMemo(
    () => tasks.find((x) => x.id === followsId) ?? null,
    [tasks, followsId]
  );
  const gap = useMemo(() => {
    if (!leader?.dueDate || !dueDate) return null;
    const a = new Date(`${dueDate}T12:00:00`).getTime();
    const b = new Date(`${leader.dueDate}T12:00:00`).getTime();
    return Math.round((a - b) / 86_400_000);
  }, [leader, dueDate]);

  const followOptions = tasks.filter((x) => x.id !== task?.id);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (task === null) {
      const input: TaskInput = {
        title: trimmed,
        sectionId: sectionId === "" ? null : sectionId,
        assigneeId: canManage ? assigneeId : meId,
        dueDate: dueDate === "" ? null : dueDate,
        followsTaskId: followsId === "" ? null : followsId,
      };
      onSubmit(input);
      return;
    }
    const update: TaskUpdate = {};
    if (allowMeta) {
      update.title = trimmed;
      update.sectionId = sectionId === "" ? null : sectionId;
    }
    if (canManage) update.assigneeId = assigneeId;
    if (allowSchedule) {
      update.dueDate = dueDate === "" ? null : dueDate;
      update.followsTaskId = followsId === "" ? null : followsId;
    }
    onSubmit(update);
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-bg p-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("planner.taskTitlePlaceholder")}
        maxLength={200}
        disabled={task !== null && !allowMeta}
        className={inputCls}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>{t("planner.assignee")}</span>
          {canManage ? (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={inputCls}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-1 py-2 text-sm text-ink">
              {members.find((m) => m.id === (task?.assignee?.id ?? meId))?.name ??
                ""}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>{t("planner.dueDate")}</span>
          <input
            type="date"
            value={dueDate}
            disabled={task !== null && !allowSchedule}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </label>
        {sections.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className={labelCls}>{t("planner.section")}</span>
            <select
              value={sectionId}
              disabled={task !== null && !allowMeta}
              onChange={(e) => setSectionId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t("planner.noSection")}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className={labelCls}>{t("planner.follows")}</span>
          <select
            value={followsId}
            disabled={task !== null && !allowSchedule}
            onChange={(e) => setFollowsId(e.target.value)}
            className={inputCls}
          >
            <option value="">{t("planner.followsNone")}</option>
            {followOptions.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {gap !== null && leader && (
        <p className="text-2xs text-muted">
          {gap >= 0
            ? t("planner.gapInfoAfter", { n: gap, title: leader.title })
            : t("planner.gapInfoBefore", { n: Math.abs(gap), title: leader.title })}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          disabled={busy || title.trim() === ""}
          onClick={handleSubmit}
          className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {task === null ? t("planner.addTask") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
