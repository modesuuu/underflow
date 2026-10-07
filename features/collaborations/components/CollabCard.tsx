"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import type { CollabProject } from "../types";

interface CollabCardProps {
  project: CollabProject;
}

/**
 * Project card (Figma "Collaborations" frame).
 * Accessible: article + stretched Link, Apply button as sibling (never nested).
 * Hover: fixed playful tilt (-8deg) + white bg + shadow + slight scale,
 * ~300ms ease-out, pure CSS. Gated behind motion-safe: (prefers-reduced-motion).
 */
export function CollabCard({ project }: CollabCardProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const firstMember = project.members[0];

  return (
    <article
      className={
        "relative flex flex-col gap-3 rounded-lg bg-bg p-4 origin-center " +
        "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out " +
        "motion-safe:hover:shadow-lg " +
        "motion-safe:hover:-rotate-[8deg] motion-safe:hover:bg-surface motion-safe:hover:scale-[1.03]"
      }
    >
      {/* Stretched link — covers the whole card, accessible to keyboard */}
      <Link
        href={`/collaborations/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Content on top of the link */}
      <div className="relative z-10 flex flex-col gap-2 pointer-events-none">
        {/* Top row: status pill badge + bookmark icon */}
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-accent px-2 py-0.5 text-xs font-medium capitalize text-accent">
            {project.status}
          </span>
          <Icon name="bookmark" size={16} className="text-ink" />
        </div>
        <h3 className="line-clamp-2 text-xl font-bold leading-tight text-ink">
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
        <div className="flex items-center gap-2">
          <Avatar
            size={24}
            src={firstMember?.avatarUrl}
            alt={firstMember?.name ?? "Member"}
          />
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
