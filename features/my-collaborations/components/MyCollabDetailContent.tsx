"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGrid, type Photo } from "@/components/ui/PhotoGrid";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { formatDueDate } from "@/features/collaborations/sort";
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
 * Detail page body (frame 3). Close in spirit to the public
 * `CollabDetailContent` but a separate component — the public one is not
 * modified. Differences: plain status row above the title (no pill band),
 * photo grid via the shared PhotoGrid, and a disabled bottom CTA.
 */
export function MyCollabDetailContent({ project }: MyCollabDetailContentProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos: Photo[] = project.photos.slice(0, 4).map((url, i) => ({
    id: `${project.id}-photo-${i + 1}`,
    url: isUrlish(url) ? url : undefined,
    alt: `Project photo ${i + 1}`,
  }));

  return (
    <>
      <div className="flex flex-col gap-6 px-6 pb-12 pt-6">
        {/* 1. Plain status row above the title (frame 3 — no pill band) */}
        <div className="flex items-center gap-1.5">
          <Icon name="joystick" size={16} className="text-ink" />
          <span className="text-sm font-medium capitalize text-ink">
            {project.status}
          </span>
        </div>

        {/* 2. Title + meta */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[40px] font-medium leading-tight text-ink">
            {project.title}
          </h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs font-medium text-ink">
              <Icon name="calendar" size={14} />
              Due to:{" "}
              <span className="font-semibold">
                {formatDueDate(project.dueDate)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted">
              <Icon name="time" size={14} />
              posted {project.postedAgo}
            </span>
          </div>
        </div>

        {/* 3. Photo grid (shared PhotoGrid; click opens the shared lightbox) */}
        {photos.length > 0 && (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(i) => setLightboxIndex(i)}
          />
        )}

        {/* 4. Owner card + about + work items */}
        <div className="flex flex-col gap-4 rounded-2xl bg-bg p-6">
          <h2 className="text-xs font-medium text-muted">Project owner</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar size={42} src={project.owner.avatarUrl} alt={project.owner.name} />
              <div className="flex flex-col">
                <span className="text-base font-medium text-ink">
                  {project.owner.name}
                </span>
                <span className="text-2xs text-muted">{project.owner.role}</span>
              </div>
            </div>
            {/* TODO(backend): open in-app chat / GET /api/chat/:ownerId */}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="message-rounded" size={14} />
              Chat with owner
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-ink">About the project</h2>
            <p className="text-sm leading-relaxed text-ink">
              {project.description}
            </p>
          </div>

          {project.workItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-medium text-ink">
                What you&apos;ll work on
              </h3>
              <ul className="flex flex-col gap-1.5">
                {project.workItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 5. Skills (singular heading per frame) */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-medium text-ink">Skill needed</h2>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span
                key={skill.id}
                className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink"
              >
                {skill.icon && <Icon name={skill.icon} size={14} />}
                {skill.label}
              </span>
            ))}
          </div>
        </div>

        {/* 6. Team — filled members AND open slots (never drop open slots) */}
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
          <div className="flex flex-wrap gap-4">
            {project.members.map((member) =>
              member.isOpenSlot ? (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="flex size-[32px] items-center justify-center rounded-full bg-muted">
                    <Icon name="plus" size={14} className="text-surface" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-ink">Open slot</span>
                    <span className="text-2xs text-muted">{member.role}</span>
                  </div>
                </div>
              ) : (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar size={32} src={member.avatarUrl} alt={member.name} />
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-ink">{member.name}</span>
                    <span className="text-2xs text-muted">{member.role}</span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* 7. Bottom CTA — presentational this phase (spec decision #3).
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
    </>
  );
}
