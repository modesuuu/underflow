import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate } from "../sort";
import type { CollabProject, ProjectStatus } from "../types";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
};

export const STATUS_DOT: Record<ProjectStatus, string> = {
  // The dot marks a real state; open seats get the lime.
  open: "bg-accent ring-1 ring-ink/25",
  "in-progress": "bg-ink",
  completed: "bg-placeholder ring-1 ring-line",
};

/**
 * One line of the collaborations index. The row carries the
 * scanning facts only — title, the need line, seats, due — and
 * selecting it drives the preview pane beside the index. The
 * detail page is one more click (the chevron, or the preview's
 * own link) for anyone who wants the full brief.
 */
export function ProjectIndexRow({
  project,
  selected,
  onSelect,
}: {
  project: CollabProject;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={clsx(
        "group flex w-full cursor-pointer items-center gap-4 px-3 py-3.5 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
        selected ? "bg-bg" : "hover:bg-bg/60",
      )}
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${STATUS_DOT[project.status]}`}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={clsx(
            "truncate text-[15px] text-ink",
            selected ? "font-semibold" : "font-medium",
          )}
        >
          {project.title}
        </span>
        <span className="truncate text-xs text-muted">{project.subtitle}</span>
      </span>
      <span className="hidden w-24 shrink-0 flex-col items-end gap-1.5 sm:flex">
        <span className="text-xs font-medium text-ink">
          {project.slotsFilled}/{project.slotsTotal} seats
        </span>
        <span
          className="flex w-full gap-0.5"
          role="img"
          aria-label={`${project.slotsFilled} of ${project.slotsTotal} seats filled`}
        >
          {Array.from({ length: project.slotsTotal }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < project.slotsFilled
                  ? "bg-ink"
                  : project.status === "open"
                    ? "bg-accent"
                    : "bg-placeholder"
              }`}
            />
          ))}
        </span>
      </span>
      <span className="hidden w-14 shrink-0 text-right text-xs text-subtle md:block">
        {formatDueDate(project.dueDate)}
      </span>
      <Icon
        name="chevron-right"
        size={18}
        className={clsx(
          "shrink-0 transition-colors",
          selected ? "text-ink" : "text-placeholder group-hover:text-subtle",
        )}
      />
    </button>
  );
}
