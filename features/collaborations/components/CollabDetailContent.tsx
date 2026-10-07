"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { ApplyCta } from "./ApplyCta";
import type { CollabProject } from "../types";

interface CollabDetailContentProps {
  project: CollabProject;
}

/**
 * Detail page content (Penpot "Collaborations - Details").
 * Sections: hero, apply CTA, team, skills, about + owner, photos.
 */
export function CollabDetailContent({ project }: CollabDetailContentProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;

  return (
    <div className="flex flex-col gap-8 px-6 pb-12">
      {/* Hero: title + status + meta */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon name="joystick" size={20} className="text-ink" />
          <span className="text-xs font-medium capitalize">
            {project.status}
          </span>
        </div>
        <h1 className="text-[40px] font-medium leading-tight">
          {project.title}
        </h1>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <Icon name="time" size={14} />
            posted {project.postedAgo}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <Icon name="calendar" size={14} />
            Due to: {project.dueDate}
          </span>
        </div>
      </div>

      {/* Apply CTA with state variants (Penpot "btn-variant") */}
      <ApplyCta projectId={project.id} slotsFull={isFull} />

      {/* Team */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Team</h2>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {project.slotsFilled}/{project.slotsTotal}
            </span>
            <Icon name="group" size={20} className="text-ink" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {project.members.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <Avatar size={32} src={member.avatarUrl} alt={member.name} />
              <div className="flex flex-col">
                <span className="text-base font-medium">{member.name}</span>
                <span className="text-2xs text-muted">{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills needed */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Skill needed</h2>
        <div className="flex flex-wrap gap-2">
          {project.skills.map((skill) => (
            <span
              key={skill.id}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink"
            >
              {skill.icon && <Icon name={skill.icon} size={14} />}
              {skill.label}
            </span>
          ))}
        </div>
      </div>

      {/* About the project */}
      <div className="flex flex-col gap-4 rounded-3xl bg-bg p-6">
        <h2 className="text-xl font-medium">About the project</h2>
        <p className="text-base leading-relaxed">{project.description}</p>

        {project.workItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium">
              What you&apos;ll work on
            </h3>
            <ul className="flex flex-col gap-1">
              {project.workItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-base">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Project owner */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-medium">Project owner</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                size={32}
                src={project.owner.avatarUrl}
                alt={project.owner.name}
              />
              <div className="flex flex-col">
                <span className="text-base font-medium">
                  {project.owner.name}
                </span>
                <span className="text-2xs text-muted">
                  {project.owner.role}
                </span>
              </div>
            </div>
            {/* TODO(backend): open in-app chat / GET /api/chat/:ownerId */}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-md bg-accent px-3 py-2 text-xs font-medium text-ink transition-opacity hover:opacity-85"
            >
              <Icon name="message-rounded" size={14} />
              Chat with owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}