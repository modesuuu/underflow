"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { ApplyCta } from "./ApplyCta";
import { formatDueDate } from "../sort";
import { STATUS_ICONS } from "../status";
import type { CollabProject } from "../types";
import {
  acceptCollabApplication,
  backendErrorMessage,
  declineCollabApplication,
  getCollabApplications,
  getCollabProjectAuthed,
  type CollabApplication,
} from "../api";
import { toast } from "sonner";
import { startDirectThread } from "@/features/inbox/store";
import { useSessionUser } from "@/features/auth/store";

/**
 * Collab photos are `string[]` (URLs per the API contract). The mock uses
 * placeholder tokens ("photo-1"); treat a value as a real URL only when it
 * looks like one, otherwise keep the lime placeholder tile so the mock doesn't
 * paint broken <img>s.
 */
function isUrlish(s: string): boolean {
  return /^https?:\/\//.test(s) || s.startsWith("//") || s.startsWith("/");
}

interface CollabDetailContentProps {
  project: CollabProject;
}

export function CollabDetailContent({ project }: CollabDetailContentProps) {
  const [liveProject, setLiveProject] = useState<CollabProject | null>(null);
  const [applications, setApplications] = useState<CollabApplication[] | null>(null);

  // Seat counts + application state come from the API, never computed
  // client-side; the authed refresh below overwrites the server values.
  const slotsFilled = liveProject?.slotsFilled ?? project.slotsFilled;
  const slotsTotal = liveProject?.slotsTotal ?? project.slotsTotal;
  const isFull = slotsFilled >= slotsTotal;
  const myApplication =
    liveProject?.myApplication ?? project.myApplication ?? null;
  const applyInitialState =
    myApplication === "pending"
      ? "pending"
      : myApplication === "accepted"
        ? "entered"
        : myApplication === "declined"
          ? "declined"
          : "default";
  const router = useRouter();
  const sessionUser = useSessionUser();
  const ownerPersonId = project.owner.id;
  const isOwnProject =
    sessionUser !== null && sessionUser.id === ownerPersonId;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Authed refresh (client-side only: the server render has no token,
  // so the project prop carries no my_application). Fills in the
  // session user's application state + fresh seat counts.
  useEffect(() => {
    if (sessionUser === null) return;
    let cancelled = false;
    void getCollabProjectAuthed(project.id)
      .then((fresh) => {
        if (!cancelled && fresh) setLiveProject(fresh);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [sessionUser, project.id]);

  // Owner applications (owner only): fetched when the viewer is the owner.
  useEffect(() => {
    if (!isOwnProject) return;
    let cancelled = false;
    void getCollabApplications(project.id)
      .then((rows) => {
        if (!cancelled) setApplications(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOwnProject, project.id]);

  const refreshLive = async () => {
    try {
      const fresh = await getCollabProjectAuthed(project.id);
      if (fresh) setLiveProject(fresh);
    } catch {
      // Backend unreachable: keep the server-rendered project.
    }
  };

  const refreshApplications = async () => {
    try {
      setApplications(await getCollabApplications(project.id));
    } catch {
      // Keep the previous list on failure.
    }
  };

  const handleAccept = async (applicationId: string) => {
    try {
      await acceptCollabApplication(project.id, applicationId);
      toast.success("Application accepted", {
        description: "The applicant is now a member.",
      });
      await refreshApplications();
      await refreshLive();
    } catch (err) {
      toast.error("Could not accept", {
        description: backendErrorMessage(err),
      });
    }
  };

  const handleDecline = async (applicationId: string) => {
    try {
      await declineCollabApplication(project.id, applicationId);
      toast("Application declined", {
        description: "The applicant can apply again.",
      });
      await refreshApplications();
    } catch (err) {
      toast.error("Could not decline", {
        description: backendErrorMessage(err),
      });
    }
  };

  // Map the collab photo strings to the shared `Photo` shape
  // (components/ui/PhotoGrid), which the lightbox also consumes.
  const lightboxPhotos = project.photos.slice(0, 4).map((url, i) => ({
    id: `${project.id}-photo-${i + 1}`,
    url: isUrlish(url) ? url : undefined,
    alt: `Project photo ${i + 1}`,
  }));

  return (
    <>
    <div className="flex flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
      {/* 1. Header band (light gray) */}
      <div className="flex flex-col gap-4 rounded-2xl p-4 sm:p-6">
        {/* Status pill */}
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink">
            <Icon name={STATUS_ICONS[project.status]} size={14} />
            {project.status}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[40px] font-medium leading-tight text-ink">
          {project.title}
        </h1>

        {/* Meta row: due bold dark + posted gray. No Due chip when the
            collab has no due date. */}
        <div className="flex items-center gap-4">
          {project.dueDate ? (
            <span className="flex items-center gap-1 text-xs font-medium text-ink">
              <Icon name="calendar" size={14} />
              Due: {formatDueDate(project.dueDate)}
            </span>
          ) : null}
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <Icon name="time" size={14} />
            posted {project.postedAgo}
          </span>
        </div>

        {/* Adaptive photo grid (shared PhotoGrid, components/ui):
            1 photo = full-width, 2 = two columns, 3 = one tall + two
            stacked, 4+ = 2x2 with a +N overlay. Non-URL mock tokens
            still paint the lime placeholder tile. Click opens the
            lightbox at that index. */}
        {project.photos.length > 0 && (
          <PhotoGrid
            photos={lightboxPhotos}
            onPhotoClick={(i) => setLightboxIndex(i)}
          />
        )}
      </div>

      {/* 2. Owner card (light gray, large rounded) */}
      <div className="flex flex-col gap-4 rounded-2xl bg-bg p-4 sm:p-6">
        {/* Project owner row */}
        <div className="flex items-center justify-between">
          <Link
            href={`/profile/${project.owner.id}`}
            className="group flex items-center gap-3"
            aria-label={`View ${project.owner.name}'s profile`}
          >
            <Avatar size={42} src={project.owner.avatarUrl} alt={project.owner.name} />
            <div className="flex flex-col">
              <span className="text-base font-medium text-ink group-hover:underline">
                {project.owner.name}
              </span>
              <span className="text-2xs text-muted">{project.owner.role}</span>
            </div>
          </Link>
          {/* Chat with owner: open (or create) the 1:1 inbox thread
              with the owner and go straight to it. Your own project:
              the button is greyed out and unclickable instead of
              opening a chat with yourself. */}
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
              onClick={() => {
                startDirectThread({
                  personId: ownerPersonId,
                  name: project.owner.name,
                });
                router.push("/inbox");
              }}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="message-rounded" size={14} />
              Chat with owner
            </button>
          )}
        </div>

        {/* About the project */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-ink">About the project</h2>
          <p className="text-sm leading-relaxed text-ink">
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
              {slotsFilled}/{slotsTotal}
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
                href={`/profile/${member.id}`}
                className="group flex items-center gap-2"
                aria-label={`View ${member.name}'s profile`}
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

      {/* 4b. Applications (owner only): pending first, Accept / Decline. */}
      {isOwnProject && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-ink">Applications</h2>
            <span className="text-sm font-medium text-muted">
              {applications === null
                ? ""
                : `${applications.filter((a) => a.status === "pending").length} pending`}
            </span>
          </div>
          {applications === null ? (
            <p className="text-sm text-muted">Loading applications…</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-muted">No applications yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-bg p-4"
                >
                  <Link
                    href={`/profile/${app.user_id}`}
                    className="group flex min-w-0 items-center gap-3"
                    aria-label={`View ${app.username}'s profile`}
                  >
                    <Avatar
                      size={32}
                      src={app.photo_profile_url || undefined}
                      alt={app.username}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-base font-medium text-ink group-hover:underline">
                        {app.username}
                      </span>
                      {app.message && (
                        <span className="line-clamp-1 text-2xs text-muted">
                          {app.message}
                        </span>
                      )}
                      <span className="text-2xs text-muted">
                        {app.status === "pending"
                          ? "Pending review"
                          : app.status === "accepted"
                            ? "Accepted"
                            : "Declined"}
                      </span>
                    </div>
                  </Link>
                  {app.status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAccept(app.id)}
                        className="cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDecline(app.id)}
                        className="cursor-pointer rounded-full bg-placeholder px-4 py-2 text-xs font-medium text-muted transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* 5. Apply CTA block (at the BOTTOM) */}
      <ApplyCta
        projectId={project.id}
        slotsFull={isFull}
        isOwner={isOwnProject}
        initialState={applyInitialState}
        projectTitle={project.title}
        projectMeta={project.subtitle.replace(/\.+$/, "")}
        dueLabel={formatDueDate(project.dueDate)}
        slotsLabel={`${slotsFilled} / ${slotsTotal}`}
        ownerName={project.owner.name}
        ownerPersonId={ownerPersonId}
      />
    </div>
    {lightboxIndex !== null && (
      <PhotoLightbox
        photos={lightboxPhotos}
        startIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    )}
    </>
  );
}
