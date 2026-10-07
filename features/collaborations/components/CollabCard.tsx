"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import type { CollabProject } from "../types";

/** Dark-charcoal fallback placeholder (no token — eyeballed from design). */
const CHARCOAL_PLACEHOLDER = "#3a3a3a";

interface CollabCardProps {
  project: CollabProject;
}

/**
 * Project card (Figma node 611-2 `collaborations-user-public`, 400% audit).
 * Default: flat light-gray card, no border/shadow. Status = joystick icon +
 * plain text (no pill, no bookmark). Hover: -8deg tilt + white bg + shadow +
 * 1.03 scale, with a hairline divider fading in between due-row and footer.
 */
export function CollabCard({ project }: CollabCardProps) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const avatarA = project.members[0];
  const avatarB = project.members[1];

  return (
    <article
      className={
        "group relative flex origin-center flex-col rounded-xl bg-bg p-5 " +
        "h-full " +
        "motion-safe:transition-[transform,background-color,box-shadow] " +
        "motion-safe:duration-300 motion-safe:ease-out " +
        "motion-safe:hover:-rotate-[8deg] motion-safe:hover:bg-surface " +
        "motion-safe:hover:shadow-lg motion-safe:hover:scale-[1.03]"
      }
    >
      {/* Stretched link — whole card clickable, keyboard reachable */}
      <Link
        href={`/collaborations/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Content — pointer-events disabled so the link owns the hit area */}
      <div className="pointer-events-none relative z-10 flex flex-col">
        {/* Status row: joystick + plain text, top-right corner empty */}
        <div className="flex items-center gap-1.5">
          <Icon name="joystick" size={16} className="text-ink" />
          <span className="text-[13px] font-medium text-ink">
            {project.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 text-[28px] font-extrabold leading-[1.15] text-ink">
          {project.title}
        </h3>

        {/* Subtitle — single line, 3-dot ellipsis */}
        <p className="mt-2 line-clamp-1 text-[15px] font-medium text-muted">
          {project.subtitle}
        </p>

        {/* Due row: solid black calendar + "Due to:" label + bold date */}
        <div className="mt-4 flex items-center gap-1.5">
          <Icon name="calendar" solid size={14} className="text-ink" />
          <span className="text-[13px] text-muted">Due to:</span>
          <span className="text-[13px] font-semibold text-ink">
            {project.dueDate}
          </span>
        </div>
      </div>

      {/* Footer pinned near bottom; divider fades in on hover */}
      <div className="relative z-10 mt-auto pt-7">
        <div
          aria-hidden="true"
          className="h-px bg-placeholder opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100"
        />
        <div className="pointer-events-auto flex items-center justify-between pt-4">
          {/* Left: avatar pair + filled/total count */}
          <div className="flex items-center">
            <div className="relative flex">
              <Avatar
                size={28}
                src={avatarA?.avatarUrl}
                alt={avatarA?.name ?? "Member"}
                className="ring-2 ring-bg"
                placeholderBg={avatarA?.avatarUrl ? undefined : CHARCOAL_PLACEHOLDER}
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

          {/* Right: Apply / Full */}
          <button
            type="button"
            disabled={isFull}
            aria-label={isFull ? "Slots full" : `Apply to ${project.title}`}
            className={
              isFull
                ? "flex items-center gap-1.5 rounded-xl bg-placeholder px-5 py-2.5 text-sm font-semibold text-muted"
                : "pressable flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            }
          >
            {isFull ? "Full" : "Apply"}
            {!isFull && <Icon name="send" size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
}
