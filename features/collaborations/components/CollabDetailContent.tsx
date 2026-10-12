"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { CapacityStrip } from "@/components/ui/CapacityStrip";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { ApplyCta } from "./ApplyCta";
import { formatDueDate } from "../sort";
import type { CollabProject } from "../types";

/**
 * Collab photos are `string[]` (URLs per the API contract). The mock uses
 * placeholder tokens ("photo-1"); treat a value as a real URL only when it
 * looks like one, otherwise keep the mist placeholder tile.
 */
function isUrlish(s: string): boolean {
  return /^https?:\/\//.test(s) || s.startsWith("//") || s.startsWith("/");
}

interface CollabDetailContentProps {
  project: CollabProject;
}

/* The project detail is the full log page for one entry: the header sheet, a
   ruled section stack (owner / about / what you'll work on), the skills as
   tags, the team as slots, and the apply CTA as the closing line. */
export function CollabDetailContent({ project }: CollabDetailContentProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxPhotos = project.photos.slice(0, 4).map((url, i) => ({
    id: `${project.id}-photo-${i + 1}`,
    url: isUrlish(url) ? url : undefined,
    alt: `Project photo ${i + 1}`,
  }));

  return (
    <>
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 py-6">
        {/* 1. Header sheet */}
        <div className="sheet flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-rule px-2.5 py-1">
              <span className="size-1.5 rounded-full bg-ink" />
              <span className="text-2xs font-medium text-ink">
                {project.status}
              </span>
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-[-0.02em] text-ink">
            {project.title}
          </h1>

          <div className="flex items-center gap-4">
            <span className="font-figures flex items-center gap-1.5 text-2xs font-medium text-ink">
              <Icon name="calendar" size={14} />
              Due {formatDueDate(project.dueDate)}
            </span>
            <span className="font-figures flex items-center gap-1.5 text-2xs text-muted">
              <Icon name="time" size={14} />
              posted {project.postedAgo}
            </span>
          </div>

          <CapacityStrip filled={project.slotsFilled} total={project.slotsTotal} />

          {project.photos.length > 0 && (
            <PhotoGrid
              photos={lightboxPhotos}
              onPhotoClick={(i) => setLightboxIndex(i)}
            />
          )}
        </div>

        {/* 2. Owner + about sheet */}
        <div className="sheet flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                size={40}
                src={project.owner.avatarUrl}
                alt={project.owner.name}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">
                  {project.owner.name}
                </span>
                <span className="text-2xs text-muted">{project.owner.role}</span>
              </div>
            </div>
            {/* TODO(backend): open in-app chat / GET /api/chat/:ownerId */}
            <button
              type="button"
              className="pressable flex cursor-pointer items-center gap-1.5 rounded-sm border border-ink px-3 py-1.5 text-2xs font-semibold text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="message-rounded" size={14} />
              Chat with owner
            </button>
          </div>

          <div className="border-t border-rule pt-5">
            <h2 className="text-xs font-semibold tracking-[0.06em] text-muted">
              About the project
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {project.description}
            </p>
          </div>

          {project.workItems.length > 0 && (
            <div className="border-t border-rule pt-5">
              <h2 className="text-xs font-semibold tracking-[0.06em] text-muted">
                What you&apos;ll work on
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {project.workItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-ink"
                  >
                    <span className="font-figures mt-0.5 shrink-0 text-2xs text-subtle">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3. Skills — tags, hairline rules, the ink does the job */}
        <div className="sheet flex flex-col gap-3 p-6">
          <h2 className="text-xs font-semibold tracking-[0.06em] text-muted">
            Skills needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span
                key={skill.id}
                className="flex items-center gap-1.5 rounded-sm border border-rule px-2.5 py-1 text-xs font-medium text-ink"
              >
                {skill.icon && <Icon name={skill.icon} size={13} />}
                {skill.label}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Team — filled members and open slots */}
        <div className="sheet flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-[0.06em] text-muted">
              Team
            </h2>
            <CapacityStrip
              filled={project.slotsFilled}
              total={project.slotsTotal}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            {project.members.map((member) =>
              member.isOpenSlot ? (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-subtle">
                    <Icon name="plus" size={14} className="text-subtle" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-muted">
                      {member.name}
                    </span>
                    <span className="text-2xs text-subtle">{member.role}</span>
                  </div>
                </div>
              ) : (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar size={32} src={member.avatarUrl} alt={member.name} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-ink">
                      {member.name}
                    </span>
                    <span className="text-2xs text-muted">{member.role}</span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* 5. Apply CTA — the closing line */}
        <ApplyCta projectId={project.id} slotsFull={isFull} />
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