"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { CollabProject } from "../types";

interface CollabCardProps {
  project: CollabProject;
}

/**
 * Project card (Figma "Collaborations" frame).
 * Accessible: article + stretched Link, Apply button as sibling (never nested).
 */
export function CollabCard({ project }: CollabCardProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;

  return (
    <article className="relative flex flex-col gap-3 rounded-lg bg-bg p-4 transition-shadow hover:shadow-md">
      {/* Stretched link — covers the whole card, accessible to keyboard */}
      <Link
        href={`/collaborations/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Content on top of the link */}
      <div className="relative z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-1">
          <Icon name="joystick" size={16} className="text-ink" />
          <span className="text-xs font-medium capitalize">
            {project.status}
          </span>
        </div>
        <h3 className="line-clamp-2 text-xl font-medium leading-tight">
          {project.title}
        </h3>
        <p className="text-sm font-medium text-muted">{project.subtitle}</p>
        <div className="flex items-center gap-1">
          <Icon name="calendar" size={14} className="text-muted" />
          <span className="text-xs font-medium text-muted">
            Due: {project.dueDate}
          </span>
        </div>
      </div>

      {/* Footer row — pointer events re-enabled for the button */}
      <div className="relative z-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1">
          <Icon name="group" size={16} className="text-muted" />
          <span className="text-xs font-medium text-muted">
            {project.slotsFilled} / {project.slotsTotal}
          </span>
        </div>
        <button
          type="button"
          disabled={isFull}
          aria-label={isFull ? "Slots full" : `Apply to ${project.title}`}
          className={
            isFull
              ? "flex cursor-not-allowed items-center gap-1 rounded-full bg-placeholder px-3 py-1.5 text-xs font-medium text-muted"
              : "flex cursor-pointer items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          }
        >
          {isFull ? "Full" : "Apply"}
          {!isFull && <Icon name="send" size={12} />}
        </button>
      </div>
    </article>
  );
}
