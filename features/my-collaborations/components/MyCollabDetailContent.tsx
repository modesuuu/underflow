"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGrid, type Photo } from "@/components/ui/PhotoGrid";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { startDirectThread } from "@/features/inbox/store";
import { STATUS_ICONS } from "@/features/collaborations/status";
import { MakeCollabModal } from "@/features/collaborations/components/MakeCollabModal";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import {
  backendErrorMessage,
  deleteCollabProject,
} from "@/features/collaborations/api";
import { toast } from "sonner";
import { useSessionUser } from "@/features/auth/store";
import type { MyCollabProject } from "../types";

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
 * kept on purpose: no Apply CTA (Open Circle + Closed instead), and the
 * myStatus-gated Circle entry.
 */
export function MyCollabDetailContent({ project }: MyCollabDetailContentProps) {
  const router = useRouter();
  const sessionUser = useSessionUser();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isOwner = sessionUser !== null && sessionUser.id === project.owner.id;

  const handleDeleteProject = async () => {
    try {
      await deleteCollabProject(project.id);
      toast.success("Project deleted");
      router.push("/my-collaborations");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? backendErrorMessage(err)
          : "Couldn't delete this project. Try again."
      );
    }
  };
  const ownerPersonId = project.owner.id;
  const isOwnProject =
    sessionUser !== null && sessionUser.id === ownerPersonId;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos: Photo[] = project.photos.slice(0, 4).map((url, i) => ({
    id: `${project.id}-photo-${i + 1}`,
    url: isUrlish(url) ? url : undefined,
    alt: `Project photo ${i + 1}`,
  }));

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
        {/* 1. Header band (light gray) */}
        <div className="flex flex-col gap-4 rounded-2xl p-4 sm:p-6">
          {/* Status pill (+ Edit for the owner) */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink">
              <Icon name={STATUS_ICONS[project.status]} size={14} />
              {project.status}
            </span>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon name="edit" size={14} />
                  Edit
                </button>
                {project.slotsFilled <= 1 && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-badge transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Icon name="trash" size={14} />
                    Delete
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
            <span className="flex items-center gap-1 text-xs font-medium text-ink">
              <Icon name="calendar" size={14} />
              Due: {project.dueDate}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted">
              <Icon name="time" size={14} />
              posted {project.postedAgo}
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
        <div className="flex flex-col gap-4 rounded-2xl bg-bg p-4 sm:p-6">
          {/* Project owner row */}
          <div className="flex items-center justify-between">
            <Link
              href={"/profile/" + (project.owner.id)}
              className="group flex items-center gap-3"
              aria-label={"View " + project.owner.name + "'s profile"}
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
                title="This is your project"
                className="flex cursor-not-allowed items-center gap-1 rounded-full bg-placeholder px-4 py-2 text-xs font-medium text-muted"
              >
                <Icon name="message-rounded" size={14} />
                This is your project
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
                    toast.error("Couldn't open the chat", {
                      description: backendErrorMessage(err),
                    });
                  }
                }}
                className="flex cursor-pointer items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Icon name="message-rounded" size={14} />
                Chat with owner
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-ink">About the project</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {project.description}
            </p>
          </div>

        </div>

        {/* 3. Skills needed (heading on white, lime pills with icon + label) */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-medium text-ink">Skills needed</h2>
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
            <h2 className="text-xl font-medium text-ink">Team</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-ink">
                {project.slotsFilled}/{project.slotsTotal}
              </span>
              <Icon name="group" size={20} className="text-ink" />
            </div>
          </div>
          <div className="flex gap-4">
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
                /* Filled member: avatar + name + role — links to profile */
                <Link
                  key={member.id}
                  href={"/profile/" + (member.id)}
                  className="group flex items-center gap-2"
                  aria-label={"View " + member.name + "'s profile"}
                >
                  <Avatar size={32} src={member.avatarUrl} alt={member.name} />
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-ink group-hover:underline">{member.name}</span>
                    <span className="text-2xs text-muted">{member.role}</span>
                  </div>
                </Link>
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
            Open Circle
          </Link>
        )}
        {/* 5. Bottom CTA — presentational this phase (spec decision #3).
               TODO(backend): label/state derive from the user's application
               status (accepted / rejected / closed). */}
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-md bg-ink/80 py-3.5 text-base font-semibold text-surface"
        >
          Closed
        </button>
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
          title="Delete this project?"
          description="This project will be removed for everyone. This can't be undone."
          confirmLabel="Delete"
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
