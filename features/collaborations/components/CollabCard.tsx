"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { CapacityStrip } from "@/components/ui/CapacityStrip";
import { EntryNumber } from "@/components/ui/Sheet";
import { formatDueDate } from "../sort";
import type { CollabProject } from "../types";

interface CollabCardProps {
  project: CollabProject;
  index?: number;
}

/* A project card is a catalogue entry on the pad: sheet, entry number, status
   tag, title, the capacity strip (the signature move — its slot budget is the
   first-class number), due date, team, apply. */
export function CollabCard({ project, index }: CollabCardProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const avatarA = project.members[0];
  const avatarB = project.members[1];

  return (
    <article className="collab-card sheet group relative flex h-full flex-col p-5">
      {/* Stretched link — whole card clickable, keyboard reachable */}
      <Link
        href={`/collaborations/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Content — pointer-events disabled so the link owns the hit area */}
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        {/* Status row + entry number */}
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-rule px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-ink" />
            <span className="text-2xs font-medium text-ink">
              {project.status}
            </span>
          </span>
          {index !== undefined && (
            <EntryNumber value={`#${String(index + 1).padStart(3, "0")}`} />
          )}
        </div>

        {/* Title */}
        <h3 className="mt-3 line-clamp-2 text-2xl font-bold leading-tight tracking-[-0.01em] text-ink">
          {project.title}
        </h3>

        {/* Subtitle */}
        <p className="mt-2 line-clamp-1 text-sm text-muted">
          {project.subtitle}
        </p>

        {/* The capacity strip — signature move */}
        <div className="mt-4">
          <CapacityStrip filled={project.slotsFilled} total={project.slotsTotal} />
        </div>

        {/* Due row */}
        <div className="mt-3 flex items-center gap-1.5">
          <Icon name="calendar" size={14} className="text-subtle" />
          <span className="text-2xs text-muted">Due</span>
          <span className="font-figures text-2xs font-medium text-ink">
            {formatDueDate(project.dueDate)}
          </span>
        </div>
      </div>

      {/* Footer pinned near bottom */}
      <div className="relative z-10 mt-auto border-t border-rule pt-4">
        <div className="pointer-events-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative flex">
              <Avatar
                size={26}
                src={avatarA?.avatarUrl}
                alt={avatarA?.name ?? "Member"}
                className="ring-2 ring-surface"
              />
              <Avatar
                size={26}
                src={avatarB?.avatarUrl}
                alt={avatarB?.name ?? "Member"}
                className="-ml-2.5 ring-2 ring-surface"
              />
            </div>
          </div>

          {/* The one solid control on the card is the action. */}
          <button
            type="button"
            disabled={isFull}
            aria-label={isFull ? "Slots full" : `Apply to ${project.title}`}
            className={
              isFull
                ? "flex items-center gap-1.5 rounded-sm border border-rule px-4 py-1.5 text-xs font-semibold text-subtle"
                : "pressable flex cursor-pointer items-center gap-1.5 rounded-sm bg-ink px-4 py-1.5 text-xs font-semibold text-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            }
          >
            {isFull ? "Full" : "Apply"}
            {!isFull && <Icon name="send" size={13} />}
          </button>
        </div>
      </div>
    </article>
  );
}