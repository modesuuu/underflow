"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGrid, type Photo } from "@/components/ui/PhotoGrid";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { startDirectThread } from "@/features/inbox/store";
import { STATUS_ICONS } from "@/features/collaborations/status";
import { formatDueDate } from "@/features/collaborations/sort";
import type {
  CollabMember,
  ProjectStatus,
} from "@/features/collaborations/types";
import { MakeCollabModal } from "@/features/collaborations/components/MakeCollabModal";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import {
  backendErrorMessage,
  completeCollabProject,
  deleteCollabProject,
  reopenCollabProject,
  setMemberWorkStatus,
} from "@/features/collaborations/api";
import { toast } from "sonner";
import { useSessionUser } from "@/features/auth/store";
import type { MyCollabProject } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { formatRelativeAgo } from "@/lib/i18n/format";

const STATUS_LABEL: Record<ProjectStatus, DictKey> = {
  open: "collab.statusOpen",
  "in-progress": "collab.statusInProgress",
  completed: "collab.statusCompleted",
};

const WORK_STATUS_LABEL: Record<"not-started" | "complete" | "revise", DictKey> = {
  "not-started": "mycollab.memberActive",
  complete: "mycollab.memberComplete",
  revise: "mycollab.memberRevise",
};

const WORK_STATUS_CHIP: Record<
  "not-started" | "complete" | "revise",
  string
> = {
  "not-started": "bg-placeholder text-muted",
  complete: "bg-accent text-on-accent",
  revise: "bg-badge text-surface",
};

const WORK_STATUS_OPTIONS: {
  value: "not-started" | "complete" | "revise";
  labelKey: DictKey;
}[] = [
  { value: "not-started", labelKey: "mycollab.memberActive" },
  { value: "complete", labelKey: "mycollab.memberComplete" },
  { value: "revise", labelKey: "mycollab.memberRevise" },
];

/**
 * Same lime-placeholder rule as the public detail: mock photo tokens
 * ("photo-1") are not URLs, so they render the placeholder tile.
 */
function isUrlish(s: string): boolean {
  return /^https?:\/\//.test(s) || s.startsWith("//") || s.startsWith("/");
}

interface MyCollabDetailContentProps {
  project: MyCollabProject;
}

/**
 * Detail page body (frame 3). Mirrors the public `CollabDetailContent`
 * section for section — same header band, owner card, skills, and team —
 * but a separate component: the public one is not modified. Differences
 * kept on purpose: no Apply CTA (Open Circle + a status bar instead), and the
 * myStatus-gated Circle entry.
 */
export function MyCollabDetailContent({
  project: initialProject,
}: MyCollabDetailContentProps) {
  const router = useRouter();
  const sessionUser = useSessionUser();
  // Local copy: the owner's progress controls update it in place
  // (the board refetches on its own mount, so no cross-page
  // invalidation is needed). Resynced when the loader hands over
  // a fresh project (e.g. after the edit modal's refresh).
  const { t, lang } = useLanguage();
  const [project, setProject] = useState(initialProject);
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);
  const [editOpen, setEditOpen] = useState(false);
  const [progressBusy, setProgressBusy] = useState(false);
  const [memberMenuId, setMemberMenuId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isOwner = sessionUser !== null && sessionUser.id === project.owner.id;

  const handleDeleteProject = async () => {
    try {
      await deleteCollabProject(project.id);
      toast.success(t("collab.projectDeleted"));
      router.push("/my-collaborations");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? backendErrorMessage(err)
          : t("collab.couldntDeleteProject")
      );
    }
  };
  const handleCompleteProject = async () => {
    setProgressBusy(true);
    try {
      await completeCollabProject(project.id);
      setProject((p) => ({
        ...p,
        status: "completed",
        myStatus: p.myStatus === "pending" ? p.myStatus : "complete",
        members: p.members.map((m) =>
          m.isOpenSlot ? m : { ...m, workStatus: "complete" as const }
        ),
      }));
      toast.success(t("mycollab.projectCompletedToast"));
    } catch (err) {
      toast.error(t("mycollab.couldntComplete"), {
        description: backendErrorMessage(err),
      });
    } finally {
      setProgressBusy(false);
    }
  };

  const handleReopenProject = async () => {
    setProgressBusy(true);
    try {
      await reopenCollabProject(project.id);
      setProject((p) => ({
        ...p,
        status: "in-progress",
        myStatus: p.myStatus === "complete" ? "not-started" : p.myStatus,
        members: p.members.map((m) =>
          m.workStatus === "complete"
            ? { ...m, workStatus: "not-started" as const }
            : m
        ),
      }));
      toast.success(t("mycollab.projectReopenedToast"));
    } catch (err) {
      toast.error(t("mycollab.couldntReopen"), {
        description: backendErrorMessage(err),
      });
    } finally {
      setProgressBusy(false);
    }
  };

  const handleSetMemberStatus = async (
    member: CollabMember,
    status: "not-started" | "complete" | "revise"
  ) => {
    setMemberMenuId(null);
    try {
      await setMemberWorkStatus(project.id, member.id, status);
      setProject((p) => ({
        ...p,
        // Same coherence rule as the backend: an unfinished
        // member reopens a completed project.
        status:
          status !== "complete" && p.status === "completed"
            ? "in-progress"
            : p.status,
        myStatus:
          sessionUser !== null && sessionUser.id === member.id
            ? status
            : p.myStatus,
        members: p.members.map((m) =>
          m.id === member.id ? { ...m, workStatus: status } : m
        ),
      }));
      toast.success(
        status === "complete"
          ? t("mycollab.memberCompleteToast", { name: member.name })
          : status === "revise"
            ? t("mycollab.memberReviseToast", { name: member.name })
            : t("mycollab.memberActiveToast", { name: member.name })
      );
    } catch (err) {
      toast.error(t("mycollab.couldntUpdateMember"), {
        description: backendErrorMessage(err),
      });
    }
  };

  const ownerPersonId = project.owner.id;
  const isOwnProject =
    sessionUser !== null && sessionUser.id === ownerPersonId;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos: Photo[] = project.photos.slice(0, 4).map((url, i) => ({
    id: `${project.id}-photo-${i + 1}`,
    url: isUrlish(url) ? url : undefined,
    alt: t("collab.photoAlt", { n: i + 1 }),
  }));

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
        {/* 1. Header band (light gray) */}
        <div className="flex flex-col gap-4 rounded-lg p-4 sm:p-6">
          {/* Status pill (+ Edit for the owner) */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink">
              <Icon name={STATUS_ICONS[project.status]} size={14} />
              {t(STATUS_LABEL[project.status])}
            </span>
            {isOwner && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {project.status === "completed" ? (
                  <button
                    type="button"
                    disabled={progressBusy}
                    onClick={() => void handleReopenProject()}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon name="refresh" size={14} />
                    {t("mycollab.reopenProject")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={progressBusy}
                    onClick={() => void handleCompleteProject()}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon name="check" size={14} />
                    {t("mycollab.completeProject")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon name="edit" size={14} />
                  {t("collab.editBtn")}
                </button>
                {project.slotsFilled <= 1 && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-badge transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Icon name="trash" size={14} />
                    {t("common.delete")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[40px] font-medium leading-tight text-ink">
            {project.title}
          </h1>

          {/* Meta row: due bold dark + posted gray */}
          <div className="flex items-center gap-4">
            {project.dueDate ? (
              <span className="flex items-center gap-1 text-xs font-medium text-ink">
                <Icon name="calendar" size={14} />
                {t("collab.dueLine", { date: formatDueDate(project.dueDate) })}
              </span>
            ) : null}
            <span className="flex items-center gap-1 text-xs font-medium text-muted">
              <Icon name="time" size={14} />
              {t("collab.postedLine", {
                ago: project.postedAt
                  ? formatRelativeAgo(project.postedAt, lang)
                  : project.postedAgo,
              })}
            </span>
          </div>

          {/* Adaptive photo grid (shared PhotoGrid; click opens the
              lightbox at that index). */}
          {photos.length > 0 && (
            <PhotoGrid
              photos={photos}
              onPhotoClick={(i) => setLightboxIndex(i)}
            />
          )}
        </div>

        {/* 2. Owner card (light gray, large rounded) */}
        <div className="flex flex-col gap-4 rounded-lg bg-bg p-4 sm:p-6">
          {/* Project owner row */}
          <div className="flex items-center justify-between">
            <Link
              href={"/profile/" + (project.owner.id)}
              className="group flex items-center gap-3"
                aria-label={t("feed.viewProfile", { name: project.owner.name })}
            >
              <Avatar size={42} src={project.owner.avatarUrl} alt={project.owner.name} />
              <div className="flex flex-col">
                <span className="text-base font-medium text-ink group-hover:underline">
                  {project.owner.name}
                </span>
                <span className="text-2xs text-muted">{project.owner.role}</span>
              </div>
            </Link>
            {/* Chat with owner: same wiring as the public detail —
                open (or create) the 1:1 inbox thread with the owner.
                Your own project: greyed out instead of chatting
                with yourself. */}
            {isOwnProject ? (
              <button
                type="button"
                disabled
                title={t("collab.yourProject")}
                className="flex cursor-not-allowed items-center gap-1 rounded-full bg-placeholder px-4 py-2 text-xs font-medium text-muted"
              >
                <Icon name="message-rounded" size={14} />
                {t("collab.yourProject")}
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await startDirectThread({
                      personId: ownerPersonId,
                      name: project.owner.name,
                      projectId: project.id,
                    });
                    router.push("/inbox");
                  } catch (err) {
                    toast.error(t("collab.couldntOpenChat"), {
                      description: backendErrorMessage(err),
                    });
                  }
                }}
                className="flex cursor-pointer items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Icon name="message-rounded" size={14} />
                {t("collab.chatWithOwner")}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-ink">{t("collab.aboutProject")}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {project.description}
            </p>
          </div>

        </div>

        {/* 3. Skills needed (heading on white, lime pills with icon + label) */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-medium text-ink">{t("collab.skillsNeeded")}</h2>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span
                key={skill.id}
                className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent"
              >
                {skill.icon && <Icon name={skill.icon} size={14} />}
                {skill.label}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Team: heading + slot count top-right; filled members AND open slots */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-ink">{t("collab.team")}</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-ink">
                {project.slotsFilled}/{project.slotsTotal}
              </span>
              <Icon name="group" size={20} className="text-ink" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {project.members.map((member) =>
              member.isOpenSlot ? (
                /* Open slot: dark-gray circle with white "+" icon */
                <div key={member.id} className="flex items-center gap-2">
                  <div className="flex size-[32px] items-center justify-center rounded-full bg-muted">
                    <Icon name="plus" size={14} className="text-surface" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-ink">{member.name}</span>
                    <span className="text-2xs text-muted">{member.role}</span>
                  </div>
                </div>
              ) : (
                /* Filled member: avatar + name + role — links to profile.
                   The work-status chip is the owner's progress signal;
                   the owner also gets the menu that changes it. */
                <div
                  key={member.id}
                  className="relative flex items-center gap-1"
                >
                  <Link
                    href={"/profile/" + (member.id)}
                    className="group flex items-center gap-2"
                    aria-label={t("feed.viewProfile", { name: member.name })}
                  >
                    <Avatar size={32} src={member.avatarUrl} alt={member.name} />
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-ink group-hover:underline">{member.name}</span>
                      <span className="text-2xs text-muted">{member.role}</span>
                      {member.workStatus && (
                        <span
                          className={
                            "mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-2xs font-semibold " +
                            WORK_STATUS_CHIP[member.workStatus]
                          }
                        >
                          {t(WORK_STATUS_LABEL[member.workStatus])}
                        </span>
                      )}
                    </div>
                  </Link>
                  {isOwner && (
                    <>
                      <button
                        type="button"
                        aria-label={t("mycollab.setStatusFor", { name: member.name })}
                        aria-haspopup="true"
                        onClick={() =>
                          setMemberMenuId((cur) =>
                            cur === member.id ? null : member.id
                          )
                        }
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <Icon name="dots-vertical-rounded" size={16} />
                      </button>
                      {memberMenuId === member.id && (
                        <>
                          <button
                            type="button"
                            aria-hidden="true"
                            tabIndex={-1}
                            onClick={() => setMemberMenuId(null)}
                            className="fixed inset-0 z-10 cursor-default"
                          />
                          <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-surface p-1 shadow-lg">
                            {WORK_STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  void handleSetMemberStatus(member, opt.value)
                                }
                                className="flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                {t(opt.labelKey)}
                                {member.workStatus === opt.value && (
                                  <Icon name="check" size={14} className="text-accent" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Circle entry (spec-circle-v1 §2.2): only for projects the user
            is actually in. A pending application has no circle yet, so the
            button is not rendered instead of shown disabled. */}
        {project.myStatus !== "pending" && (
          <Link
            href={`/circle/${project.id}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent py-3.5 text-base font-semibold text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="conversation" size={18} />
            {t("mycollab.openCircle")}
          </Link>
        )}
        {/* 5. Bottom bar — status-aware (audit 2026-11-12). The old
               always-on disabled "Closed" button sat under live
               projects too, a dead control. Now a pending application
               shows its state, a completed project shows Closed, and
               an active project shows nothing — Open Circle above is
               its call to action. */}
        {project.myStatus === "pending" ? (
          <div className="flex w-full items-center justify-center rounded-full bg-placeholder px-6 py-3 text-sm font-semibold text-muted">
            {t("collab.pending")}
          </div>
        ) : project.myStatus === "revise" && !isOwner ? (
          <div className="flex w-full items-center justify-center rounded-full bg-placeholder px-6 py-3 text-sm font-semibold text-muted">
            {t("mycollab.revisionRequestedBar")}
          </div>
        ) : project.status === "completed" ? (
          <div className="flex w-full items-center justify-center rounded-md bg-ink/80 py-3.5 text-base font-semibold text-surface">
            {t("mycollab.closedBar")}
          </div>
        ) : null}
      </div>
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      <MakeCollabModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={project}
        onUpdated={() => router.refresh()}
      />
      {confirmingDelete && (
        <ConfirmDialog
          title={t("collab.deleteProjectTitle")}
          description={t("collab.deleteProjectBody")}
          confirmLabel={t("common.delete")}
          onConfirm={() => {
            setConfirmingDelete(false);
            void handleDeleteProject();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
