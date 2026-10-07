"use client";

import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { ApplyCta } from "./ApplyCta";
import type { CollabProject } from "../types";

interface CollabDetailContentProps {
  project: CollabProject;
}

export function CollabDetailContent({ project }: CollabDetailContentProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;

  return (
    <div className="flex flex-col gap-6 px-6 pb-12 pt-6">
      {/* 1. Header band (light gray) */}
      <div className="flex flex-col gap-4 rounded-2xl  p-6">
        {/* Status pill */}
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink">
            <Icon name="joystick" size={14} />
            {project.status}
          </span>
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

        {/* 2×2 photo grid — lime placeholders with centered image icon; count = actual photos (max 4) */}
        {project.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {project.photos.slice(0, 4).map((photo, i) => (
              <div
                key={photo}
                aria-label={`Project photo ${i + 1}`}
                className="flex aspect-[4/3] items-center justify-center rounded-md bg-accent"
              >
                <Icon name="image-add" size={24} className="text-ink/40" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Owner card (light gray, large rounded) */}
      <div className="flex flex-col gap-4 rounded-2xl bg-bg p-6">
        {/* Project owner row */}
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

        {/* About the project */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-ink">About the project</h2>
          <p className="text-sm leading-relaxed text-ink">
            {project.description}
          </p>
        </div>

        {/* What you'll work on */}
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

      {/* 3. Skills needed (heading on white, lime pills with icon + label) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium text-ink">Skills needed</h2>
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
              /* Filled member: avatar + name + role */
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

      {/* 5. Apply CTA block (at the BOTTOM) */}
      <ApplyCta projectId={project.id} slotsFull={isFull} />
    </div>
  );
}
