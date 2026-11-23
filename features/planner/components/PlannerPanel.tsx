"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import { backendErrorMessage } from "@/features/collaborations/api";
import { useSessionUser } from "@/features/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  createPlannerSection,
  createPlannerTask,
  deletePlannerSection,
  deletePlannerTask,
  getPlanner,
  renamePlannerSection,
  setPlannerEnabled,
  setPlannerRole,
  updatePlannerTask,
} from "../api";
import { refreshMyTaskCount, subscribePlannerTasks } from "../store";
import type {
  PlannerData,
  PlannerSection,
  PlannerTask,
  TaskInput,
  TaskUpdate,
} from "../types";
import { TaskForm } from "./TaskForm";
import { TaskRow, addDays } from "./TaskRow";

function errStatus(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err) {
    const s = Number((err as { status: unknown }).status);
    if (Number.isFinite(s) && s > 0) return s;
  }
  if (err instanceof Error) {
    const m = /API request failed: (\d+)/.exec(err.message);
    if (m) return Number(m[1]);
  }
  return null;
}

function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function PlannerPanel({ projectId }: { projectId: string }) {
  const { t } = useLanguage();
  const sessionUser = useSessionUser();
  const meId = sessionUser?.id ?? null;

  const [data, setData] = useState<PlannerData | null>(null);
  const [hidden, setHidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PlannerTask | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [deleting, setDeleting] = useState<PlannerTask | null>(null);
  const [deletingSection, setDeletingSection] = useState<PlannerSection | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionDraft, setSectionDraft] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const today = useMemo(todayLocal, []);

  const refetch = useCallback(async () => {
    try {
      setData(await getPlanner(projectId));
    } catch (err) {
      const s = errStatus(err);
      if (s === 403 || s === 404) setHidden(true);
    }
  }, [projectId]);

  useEffect(() => {
    if (meId) void refetch();
  }, [meId, refetch]);

  useEffect(
    () =>
      subscribePlannerTasks((event) => {
        if (event.collabId === projectId) void refetch();
      }),
    [projectId, refetch]
  );

  // Polling fallback (covers the window before the realtime server
  // picks up the planner-task publish branch).
  useEffect(() => {
    const iv = window.setInterval(() => void refetch(), 20_000);
    return () => window.clearInterval(iv);
  }, [refetch]);

  const mergeTask = useCallback((task: PlannerTask) => {
    setData((d) =>
      d
        ? { ...d, tasks: d.tasks.map((x) => (x.id === task.id ? task : x)) }
        : d
    );
  }, []);

  if (meId === null || hidden) return null;

  if (data === null) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <div className="h-6 w-32 rounded bg-placeholder" />
        <div className="h-10 w-full rounded bg-placeholder/60" />
        <div className="h-10 w-full rounded bg-placeholder/60" />
      </div>
    );
  }

  const isOwner = data.myRole === "owner";
  const canManage = data.myRole !== "member";

  if (!data.enabled) {
    if (!isOwner) return null;
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium text-ink">{t("planner.title")}</h2>
          <p className="text-sm text-muted">{t("planner.enableBody")}</p>
        </div>
        <div>
          <button
            type="button"
            onClick={async () => {
              try {
                await setPlannerEnabled(projectId, true);
                void refetch();
              } catch (err) {
                toast.error(backendErrorMessage(err));
              }
            }}
            className="cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("planner.enableBtn")}
          </button>
        </div>
      </div>
    );
  }

  const canTouch = (task: PlannerTask) =>
    canManage || task.assignee?.id === meId;
  const canMeta = (task: PlannerTask) =>
    isOwner || task.createdBy.id === meId;

  const toggleDone = async (task: PlannerTask) => {
    const next = !task.done;
    setData((d) =>
      d
        ? {
            ...d,
            tasks: d.tasks.map((x) =>
              x.id === task.id ? { ...x, done: next } : x
            ),
          }
        : d
    );
    try {
      const res = await updatePlannerTask(projectId, task.id, { done: next });
      mergeTask(res.task);
      void refreshMyTaskCount();
    } catch (err) {
      setData((d) =>
        d
          ? {
              ...d,
              tasks: d.tasks.map((x) =>
                x.id === task.id ? { ...x, done: task.done } : x
              ),
            }
          : d
      );
      toast.error(backendErrorMessage(err));
    }
  };

  const pushDay = async (task: PlannerTask) => {
    if (!task.dueDate) return;
    const oldDate = task.dueDate;
    const newDate = addDays(oldDate, 1);
    try {
      const res = await updatePlannerTask(projectId, task.id, {
        dueDate: newDate,
      });
      mergeTask(res.task);
      if (res.shiftedTaskIds.length > 0) void refetch();
      void refreshMyTaskCount();
      toast.success(t("planner.dateMoved"), {
        description:
          res.shiftedTaskIds.length > 0
            ? t("planner.shiftedNotice", { n: res.shiftedTaskIds.length })
            : undefined,
        action: {
          label: t("planner.undo"),
          onClick: () => {
            void updatePlannerTask(projectId, task.id, { dueDate: oldDate })
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

  const submitForm = async (payload: TaskInput | TaskUpdate) => {
    setBusy(true);
    try {
      if (editing) {
        const res = await updatePlannerTask(
          projectId,
          editing.id,
          payload as TaskUpdate
        );
        mergeTask(res.task);
        if (res.shiftedTaskIds.length > 0) void refetch();
        setEditing(null);
        toast.success(t("planner.taskUpdated"));
      } else {
        const created = await createPlannerTask(
          projectId,
          payload as TaskInput
        );
        setData((d) => (d ? { ...d, tasks: [...d.tasks, created] } : d));
        setCreating(false);
        toast.success(t("planner.taskCreated"));
      }
      void refreshMyTaskCount();
    } catch (err) {
      toast.error(backendErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitSection = async () => {
    const title = sectionDraft.trim();
    if (!title) return;
    try {
      const section = await createPlannerSection(projectId, title);
      setData((d) => (d ? { ...d, sections: [...d.sections, section] } : d));
      setSectionDraft("");
      setAddingSection(false);
    } catch (err) {
      toast.error(backendErrorMessage(err));
    }
  };

  const submitRename = async (section: PlannerSection) => {
    const title = renameDraft.trim();
    if (!title) return;
    try {
      const fresh = await renamePlannerSection(projectId, section.id, title);
      setData((d) =>
        d
          ? {
              ...d,
              sections: d.sections.map((s) => (s.id === fresh.id ? fresh : s)),
            }
          : d
      );
      setRenamingId(null);
    } catch (err) {
      toast.error(backendErrorMessage(err));
    }
  };

  const renderGroup = (section: PlannerSection | null) => {
    const groupTasks = data.tasks.filter(
      (x) => (x.sectionId ?? null) === (section?.id ?? null)
    );
    if (section === null && groupTasks.length === 0 && data.sections.length > 0) {
      return null;
    }
    return (
      <div key={section?.id ?? "none"} className="flex flex-col gap-1">
        {(section !== null || data.sections.length > 0) && (
          <div className="group/section flex items-center gap-2 px-2 pt-2">
            {section !== null && renamingId === section.id ? (
              <>
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  maxLength={120}
                  className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitRename(section);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => void submitRename(section)}
                  className="cursor-pointer text-xs font-medium text-ink hover:underline"
                >
                  {t("common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  className="cursor-pointer text-xs font-medium text-muted hover:text-ink"
                >
                  {t("common.cancel")}
                </button>
              </>
            ) : (
              <>
                <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                  {section ? section.title : t("planner.noSection")}
                </span>
                <span className="text-2xs text-muted">{groupTasks.length}</span>
                {section !== null && canManage && (
                  <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover/section:opacity-100">
                    <button
                      type="button"
                      aria-label={t("planner.renameSection")}
                      onClick={() => {
                        setRenamingId(section.id);
                        setRenameDraft(section.title);
                      }}
                      className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:text-ink"
                    >
                      <Icon name="edit" size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={t("common.delete")}
                      onClick={() => setDeletingSection(section)}
                      className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:text-badge"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex flex-col">
          {groupTasks.map((task) =>
            editing?.id === task.id ? (
              <TaskForm
                key={task.id}
                task={task}
                members={data.members}
                sections={data.sections}
                tasks={data.tasks}
                meId={meId}
                canManage={canManage}
                allowMeta={canMeta(task)}
                allowSchedule={canTouch(task)}
                defaultSectionId={task.sectionId}
                busy={busy}
                onSubmit={(p) => void submitForm(p)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                today={today}
                canToggle={canTouch(task)}
                canPush={canTouch(task)}
                canEdit={canTouch(task) || canMeta(task)}
                canDelete={canMeta(task)}
                onToggleDone={(x) => void toggleDone(x)}
                onPushDay={(x) => void pushDay(x)}
                onEdit={(x) => setEditing(x)}
                onDelete={(x) => setDeleting(x)}
              />
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium text-ink">{t("planner.title")}</h2>
        <div className="flex items-center gap-2">
          {canManage &&
            (addingSection ? (
              <span className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={sectionDraft}
                  onChange={(e) => setSectionDraft(e.target.value)}
                  placeholder={t("planner.sectionNamePlaceholder")}
                  maxLength={120}
                  className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitSection();
                    if (e.key === "Escape") setAddingSection(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => void submitSection()}
                  className="cursor-pointer rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent transition-opacity hover:opacity-85"
                >
                  {t("common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingSection(false)}
                  className="cursor-pointer text-xs font-medium text-muted hover:text-ink"
                >
                  {t("common.cancel")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAddingSection(true)}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon name="plus" size={13} />
                {t("planner.addSection")}
              </button>
            ))}
          {isOwner && (
            <button
              type="button"
              onClick={() => setRolesOpen((v) => !v)}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon name="group" size={13} />
              {t("planner.roles")}
            </button>
          )}
        </div>
      </div>

      {isOwner && rolesOpen && (
        <div className="flex flex-col gap-2 rounded-md bg-bg p-3">
          {data.members
            .filter((m) => m.role !== "owner")
            .map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar size={28} src={m.photo ?? undefined} alt={m.name} />
                <span className="flex-1 truncate text-sm text-ink">{m.name}</span>
                <span className="font-mono text-2xs uppercase tracking-wider text-muted">
                  {m.role === "pm" ? t("planner.rolePm") : t("planner.roleMember")}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await setPlannerRole(
                        projectId,
                        m.id,
                        m.role === "pm" ? "member" : "pm"
                      );
                      void refetch();
                    } catch (err) {
                      toast.error(backendErrorMessage(err));
                    }
                  }}
                  className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {m.role === "pm" ? t("planner.removePm") : t("planner.makePm")}
                </button>
              </div>
            ))}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setConfirmDisable(true)}
              className="cursor-pointer text-xs font-medium text-badge hover:underline"
            >
              {t("planner.disable")}
            </button>
          </div>
        </div>
      )}

      {data.tasks.length === 0 && data.sections.length === 0 && !creating ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <span className="text-sm font-medium text-ink">
            {t("planner.emptyTitle")}
          </span>
          <span className="max-w-sm text-sm text-muted">
            {t("planner.emptyBody")}
          </span>
        </div>
      ) : (
        <>
          {data.sections.map((s) => renderGroup(s))}
          {renderGroup(null)}
        </>
      )}

      {creating ? (
        <TaskForm
          task={null}
          members={data.members}
          sections={data.sections}
          tasks={data.tasks}
          meId={meId}
          canManage={canManage}
          allowMeta
          allowSchedule
          defaultSectionId={null}
          busy={busy}
          onSubmit={(p) => void submitForm(p)}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-line px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon name="plus" size={14} />
          {t("planner.addTask")}
        </button>
      )}

      {deleting && (
        <ConfirmDialog
          title={t("planner.deleteTaskTitle")}
          description={t("planner.deleteTaskBody")}
          confirmLabel={t("common.delete")}
          onConfirm={() => {
            const task = deleting;
            setDeleting(null);
            void deletePlannerTask(projectId, task.id)
              .then(() => {
                setData((d) =>
                  d
                    ? { ...d, tasks: d.tasks.filter((x) => x.id !== task.id) }
                    : d
                );
                void refreshMyTaskCount();
              })
              .catch((err) => toast.error(backendErrorMessage(err)));
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deletingSection && (
        <ConfirmDialog
          title={t("planner.deleteSectionTitle")}
          description={t("planner.deleteSectionBody")}
          confirmLabel={t("common.delete")}
          onConfirm={() => {
            const section = deletingSection;
            setDeletingSection(null);
            void deletePlannerSection(projectId, section.id)
              .then(() => void refetch())
              .catch((err) => toast.error(backendErrorMessage(err)));
          }}
          onCancel={() => setDeletingSection(null)}
        />
      )}
      {confirmDisable && (
        <ConfirmDialog
          title={t("planner.disableTitle")}
          description={t("planner.disableBody")}
          confirmLabel={t("planner.disable")}
          onConfirm={() => {
            setConfirmDisable(false);
            void setPlannerEnabled(projectId, false)
              .then(() => void refetch())
              .catch((err) => toast.error(backendErrorMessage(err)));
          }}
          onCancel={() => setConfirmDisable(false)}
        />
      )}
    </section>
  );
}
