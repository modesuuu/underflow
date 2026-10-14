import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDueDate, parseDueDate } from "@/features/collaborations/sort";
import type { MyCollabProject } from "../types";

const PUBLIC_STATUS_LABEL: Record<MyCollabProject["status"], string> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One dense row of a project list — the whole row opens the
 * detail. Rows live on the stage (the ink panel that flips to
 * cream in the dark theme), so every color here is a stage
 * color: text-surface and its alpha steps. The avatar ring is
 * ring-ink because the stage ground IS bg-ink in both themes,
 * so the ring melts into the stage instead of haloing. Shared
 * by the board's status sections and the category page, so
 * both speak the same language.
 */
export function MyCollabRow({ project }: { project: MyCollabProject }) {
  const dueMs = parseDueDate(project.dueDate);
  const daysLeft =
    dueMs === Infinity
      ? null
      : Math.ceil((dueMs - Date.now()) / DAY_MS);
  const urgent =
    project.myStatus !== "complete" && daysLeft !== null && daysLeft <= 7;
  const faces = project.members.filter((m) => !m.isOpenSlot).slice(0, 2);

  return (
    <article className="group relative -mx-3 flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-surface/8">
      <Link
        href={`/my-collaborations/${project.myStatus}/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 focus-visible:ring-2 focus-visible:ring-surface focus-visible:outline-none"
      />
      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold text-surface">
          {project.title}
        </h3>
        <p className="truncate text-[13px] text-surface/55">
          {project.subtitle}
        </p>
      </div>

      <span
        className={`relative z-10 hidden shrink-0 items-center gap-1.5 text-xs sm:flex ${
          urgent ? "font-semibold text-badge" : "text-surface/55"
        }`}
      >
        <Icon name="calendar" size={14} />
        Due {formatDueDate(project.dueDate)}
        {urgent &&
          ` · ${daysLeft !== null && daysLeft <= 0 ? "due now" : `${daysLeft}d left`}`}
      </span>

      <span className="relative z-10 hidden shrink-0 items-center gap-2 md:flex">
        <span className="flex">
          {faces.map((member, i) => (
            <Avatar
              key={member.id}
              size={24}
              src={member.avatarUrl}
              alt={member.name}
              className={i > 0 ? "-ml-2 ring-2 ring-ink" : "ring-2 ring-ink"}
            />
          ))}
        </span>
        <span className="text-xs text-surface/55 tabular-nums">
          {project.slotsFilled} / {project.slotsTotal}
        </span>
      </span>

      <span className="relative z-10 hidden w-[92px] shrink-0 text-right text-xs text-surface/55 lg:block">
        {PUBLIC_STATUS_LABEL[project.status]}
      </span>
      <Icon
        name="chevron-right"
        size={18}
        className="relative z-10 shrink-0 text-surface/35 transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </article>
  );
}
