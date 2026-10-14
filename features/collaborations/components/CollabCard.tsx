import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate } from "../sort";
import type { CollabProject, ProjectStatus } from "../types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
};

const STATUS_DOT: Record<ProjectStatus, string> = {
  // The dot marks a real state; open seats get the lime.
  open: "bg-accent ring-1 ring-ink/25",
  "in-progress": "bg-ink",
  completed: "bg-placeholder ring-1 ring-line",
};

/**
 * Project card, 2026 redesign. The old card led with decoration
 * (tilt on hover, a fake Apply button that went nowhere); this
 * one leads with the decision: how many seats are left. The
 * capacity meter is derived from the project's own slots, the
 * skills say what the team needs, and the whole card is the
 * link — applying lives on the detail page.
 */
export function CollabCard({ project }: { project: CollabProject }) {
  const openSeats = Math.max(0, project.slotsTotal - project.slotsFilled);
  const isFull = openSeats === 0;
  const skills = project.skills.slice(0, 3);
  const moreSkills = project.skills.length - skills.length;

  return (
    <Link
      href={`/collaborations/${project.id}`}
      aria-label={`View ${project.title}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow,transform] duration-200 [transition-delay:0ms,40ms,0ms] hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_1px_2px_rgba(17,17,17,0.05),0_16px_36px_-16px_rgba(17,17,17,0.22)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-[0.99]"
    >
      {/* Status + age */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${STATUS_DOT[project.status]}`}
          />
          <span className="text-[13px] font-medium text-ink">
            {STATUS_LABEL[project.status]}
          </span>
        </span>
        <span className="text-xs text-subtle">{project.postedAgo}</span>
      </div>

      {/* Title + the need line */}
      <div className="flex flex-col gap-1.5">
        <h3 className="line-clamp-2 text-xl leading-snug font-semibold text-ink">
          {project.title}
        </h3>
        <p className="line-clamp-1 text-sm text-muted">{project.subtitle}</p>
      </div>

      {/* Skills the team is looking for */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-muted"
            >
              {skill.label}
            </span>
          ))}
          {moreSkills > 0 && (
            <span className="text-[11px] text-subtle">+{moreSkills} more</span>
          )}
        </div>
      )}

      {/* Capacity — the deciding fact, pinned to the bottom */}
      <div className="mt-auto flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-ink">
              {project.slotsFilled} of {project.slotsTotal} seats filled
            </span>
            <span className="text-xs font-semibold text-ink">
              {isFull ? "Full" : `${openSeats} open`}
            </span>
          </div>
          <div
            className="flex gap-1"
            role="img"
            aria-label={`${project.slotsFilled} of ${project.slotsTotal} seats filled`}
          >
            {Array.from({ length: project.slotsTotal }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < project.slotsFilled
                    ? "bg-ink"
                    : project.status === "open"
                      ? "bg-accent"
                      : "bg-placeholder"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-placeholder" aria-hidden="true" />

        {/* Owner + due */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar
              size={28}
              src={project.owner.avatarUrl}
              alt={project.owner.name}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] leading-tight font-medium text-ink">
                {project.owner.name}
              </span>
              <span className="truncate text-[11px] leading-tight text-subtle">
                {project.owner.role}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <Icon name="calendar" size={14} />
            Due {formatDueDate(project.dueDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
