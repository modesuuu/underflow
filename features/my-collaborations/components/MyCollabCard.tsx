"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { formatDueDate } from "@/features/collaborations/sort";
import type { MyCollabProject } from "../types";

interface MyCollabCardProps {
  project: MyCollabProject;
  /** "board" omits the status row (board columns are already status-scoped);
   *  "category" shows it (the grid mixes projects under one heading). */
  variant?: "board" | "category";
}

/**
 * Card for the My Collaborations board (frame 1) and category grid (frame 2).
 * Same light-gray card family + hover lift as `CollabCard` (`.collab-card`),
 * but WITHOUT the Apply button — the whole card links to the detail route.
 * Category variant adds the project status row on top (joystick + text,
 * same pattern as the public card).
 */
export function MyCollabCard({ project, variant = "board" }: MyCollabCardProps) {
  const avatarA = project.members[0];
  const avatarB = project.members[1];

  return (
    <article className="collab-card group relative flex origin-center flex-col rounded-xl bg-bg p-5 h-full active:scale-[0.99]">
      <Link
        href={`/my-collaborations/${project.myStatus}/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      <div className="pointer-events-none relative z-10 flex flex-col">
        {variant === "category" && (
          <div className="flex items-center gap-1.5">
            <Icon name="joystick" size={16} className="text-ink" />
            <span className="text-[13px] font-medium text-ink">
              {project.status}
            </span>
          </div>
        )}

        <h3 className="mt-2 line-clamp-2 text-[28px] font-extrabold leading-[1.15] text-ink">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-[15px] font-medium text-muted">
          {project.subtitle}
        </p>

        {/* Due row: solid calendar + "Due to:" + bold date */}
        <div className="mt-4 flex items-center gap-1.5">
          <Icon name="calendar" solid size={14} className="text-ink" />
          <span className="text-[13px] text-muted">Due to:</span>
          <span className="text-[13px] font-semibold text-ink">
            {formatDueDate(project.dueDate)}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-7">
        <div
          aria-hidden="true"
          className="h-px bg-placeholder opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100"
        />
        <div className="pointer-events-auto flex items-center justify-between pt-4">
          <div className="flex items-center">
            <div className="relative flex">
              <Avatar
                size={28}
                src={avatarA?.avatarUrl}
                alt={avatarA?.name ?? "Member"}
                className="ring-2 ring-bg"
                placeholderBg={avatarA?.avatarUrl ? undefined : "#3a3a3a"}
              />
              <Avatar
                size={28}
                src={avatarB?.avatarUrl}
                alt={avatarB?.name ?? "Member"}
                className="-ml-3 ring-2 ring-bg"
                placeholderBg={avatarB?.avatarUrl ? undefined : "var(--uf-placeholder)"}
              />
            </div>
            <span className="ml-2 text-xs text-muted">
              {project.slotsFilled} / {project.slotsTotal}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
