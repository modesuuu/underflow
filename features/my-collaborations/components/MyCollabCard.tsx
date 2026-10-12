"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { CapacityStrip } from "@/components/ui/CapacityStrip";
import { formatDueDate } from "@/features/collaborations/sort";
import type { MyCollabProject } from "../types";

interface MyCollabCardProps {
  project: MyCollabProject;
  /** "board" omits the status row (board columns are already status-scoped);
   *  "category" shows it (the grid mixes projects under one heading). */
  variant?: "board" | "category";
}

/**
 * Card for the My Collaborations board and category grid. Same sheet family
 * as CollabCard, but WITHOUT the Apply control — the whole card links to the
 * detail route.
 */
export function MyCollabCard({
  project,
  variant = "board",
}: MyCollabCardProps) {
  const avatarA = project.members[0];
  const avatarB = project.members[1];

  return (
    <article className="collab-card sheet group relative flex h-full flex-col p-4">
      <Link
        href={`/my-collaborations/${project.myStatus}/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      <div className="pointer-events-none relative z-10 flex flex-col">
        {variant === "category" && (
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-ink" />
            <span className="text-2xs font-medium text-ink">
              {project.status}
            </span>
          </div>
        )}

        <h3 className="mt-1.5 line-clamp-2 text-lg font-bold leading-tight text-ink">
          {project.title}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-xs text-muted">
          {project.subtitle}
        </p>

        <div className="mt-3">
          <CapacityStrip
            filled={project.slotsFilled}
            total={project.slotsTotal}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <Icon name="calendar" size={13} className="text-subtle" />
          <span className="text-2xs text-muted">Due</span>
          <span className="font-figures text-2xs font-medium text-ink">
            {formatDueDate(project.dueDate)}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-auto border-t border-rule pt-3">
        <div className="pointer-events-none flex items-center">
          <div className="relative flex">
            <Avatar
              size={24}
              src={avatarA?.avatarUrl}
              alt={avatarA?.name ?? "Member"}
              className="ring-2 ring-surface"
            />
            <Avatar
              size={24}
              src={avatarB?.avatarUrl}
              alt={avatarB?.name ?? "Member"}
              className="-ml-2 ring-2 ring-surface"
            />
          </div>
        </div>
      </div>
    </article>
  );
}