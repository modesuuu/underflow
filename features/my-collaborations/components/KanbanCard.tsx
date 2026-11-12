"use client";

import Link from "next/link";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate, parseDueDate } from "@/features/collaborations/sort";
import type { MyCollabProject } from "../types";

/**
 * Weihu pastel rotation for the cards. One tint per card, cycling
 * by index, so a set of cards shows varied pastels the way the
 * reference does. Plain CSS classes (globals.css) — not Tailwind
 * arbitrary values — so the tints are exact in the served CSS
 * and carry a dark-mode override each. The board passes the
 * GLOBAL index (startIndex + position) so the 5 tints cycle
 * across the whole board; a category page passes the same global
 * offset so a project keeps its board tint there too.
 */
const PASTEL_CLASSES = [
  "kanban-pastel-blue",
  "kanban-pastel-purple",
  "kanban-pastel-pink",
  "kanban-pastel-peach",
  "kanban-pastel-mint",
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One project card — the weihu card, translated to our data:
 * skill tags on top, title + subtitle, a dotted seat meter (the
 * reference's Progress slot), and a footer of owner avatar + due
 * date. The whole card is the link; there is no inner button and
 * no status pill (on the board the column is the status; on a
 * category page the page itself is the status). No border and no
 * scoop: weihu cards are plain rounded rectangles, and the
 * redesign follows the reference. Shared by the Kanban board and
 * the category pages (user order 2026-11-10: same UI, no
 * categories, no borders on the category pages).
 */
export function KanbanCard({
  project,
  index,
}: {
  project: MyCollabProject;
  index: number;
}) {
  const dueMs = parseDueDate(project.dueDate);
  const daysLeft =
    dueMs === Infinity
      ? null
      : Math.ceil((dueMs - Date.now()) / DAY_MS);
  const urgent =
    project.myStatus !== "complete" && daysLeft !== null && daysLeft <= 7;
  const pastel = PASTEL_CLASSES[index % PASTEL_CLASSES.length];

  return (
    <Link
      href={`/my-collaborations/${project.myStatus}/${project.id}`}
      className={clsx(
        "card-stagger group relative flex cursor-pointer flex-col gap-3 rounded-lg p-4 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.06),0_12px_28px_-12px_rgba(var(--uf-shadow-rgb),0.20)]",
        pastel
      )}
      style={{ "--stagger-i": String(Math.min(index, 11)) } as CSSProperties}
    >
      {/* Skill tags — the reference's #website / #client row. */}
      <span className="flex flex-wrap gap-1.5">
        {project.skills.slice(0, 3).map((s) => (
          <span key={s.id} className="kanban-tag rounded-full px-2.5 py-1 text-[11px] font-medium">
            {s.label}
          </span>
        ))}
        {project.skills.length > 3 && (
          <span className="kanban-tag rounded-full px-2.5 py-1 text-[11px] font-medium">
            +{project.skills.length - 3} more
          </span>
        )}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] leading-snug font-semibold text-ink">
          {project.title}
        </span>
        <span className="truncate text-[13px] text-muted">
          {project.subtitle}
        </span>
      </span>
      {/* Seat meter — the reference's dotted Progress slot.
          Dots, not bars: filled = ink, next open = accent,
          open = placeholder. */}
      <span className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted">
          Seats · {project.slotsFilled} of {project.slotsTotal}
        </span>
        <span
          className="flex gap-[3px]"
          role="img"
          aria-label={`${project.slotsFilled} of ${project.slotsTotal} seats filled`}
        >
          {Array.from({ length: project.slotsTotal }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                "size-2 rounded-full",
                i < project.slotsFilled
                  ? "bg-ink"
                  : i === project.slotsFilled
                    ? "bg-accent"
                    : "bg-placeholder"
              )}
            />
          ))}
        </span>
      </span>
      <span className="mt-auto flex items-center gap-2 pt-1">
        <Avatar
          size={28}
          src={project.owner.avatarUrl}
          alt={project.owner.name}
        />
        <span className="text-[13px] font-medium text-muted">
          {project.owner.name}
        </span>
        <span
          className={clsx(
            "ms-auto flex items-center gap-1.5 text-xs",
            urgent ? "font-semibold text-badge" : "text-muted"
          )}
        >
          <Icon name="calendar" size={14} />
          {project.dueDate ? (
            <>
              Due {formatDueDate(project.dueDate)}
              {urgent &&
                ` · ${daysLeft !== null && daysLeft <= 0 ? "due now" : `${daysLeft}d left`}`}
            </>
          ) : (
            "No deadline"
          )}
        </span>
      </span>
    </Link>
  );
}
