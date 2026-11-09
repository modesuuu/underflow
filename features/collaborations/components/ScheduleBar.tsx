import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { parseDueDate } from "../sort";
import type { CollabProject } from "../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Short due label, e.g. "25 Dec" — UTC getters, the mock dates are day-granular. */
function shortDue(ms: number): string {
  const d = new Date(ms);
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
}

/**
 * The reference's black pill schedule bar, fed by real deadlines:
 * the next due dates as slots (owner avatar + due date + title),
 * the nearest due highlighted in the reference's lime (#B9FA68,
 * sampled from the image). A slot is a link to its project. Renders
 * nothing when no project has a parsable due date.
 */
export function ScheduleBar({ projects }: { projects: CollabProject[] }) {
  const upcoming = projects
    .map((p) => ({ project: p, due: parseDueDate(p.dueDate) }))
    .filter((x) => x.due !== Infinity)
    .sort((a, b) => a.due - b.due)
    .slice(0, 3);
  if (upcoming.length === 0) return null;
  const nearest = upcoming[0];
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-full bg-ink px-3 py-2 text-surface">
      <span className="shrink-0 px-2 text-sm font-medium whitespace-nowrap">Your Schedule</span>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface/15 px-3 py-1.5 text-xs font-medium whitespace-nowrap">
        <Icon name="calendar" size={14} />
        {shortDue(nearest.due)}
      </span>
      {upcoming.map(({ project, due }, i) => {
        const active = i === 0;
        return (
          <Link
            key={project.id}
            href={"/collaborations/" + project.id}
            aria-label={"View " + project.title + ", due " + shortDue(due)}
            className={
              active
                ? "flex min-w-0 shrink-0 items-center gap-2 rounded-full bg-[var(--uf-lime)] px-2 py-1 text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                : "flex min-w-0 shrink-0 items-center gap-2 rounded-full bg-surface/10 px-2 py-1 text-surface transition-colors hover:bg-surface/20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            }
          >
            <Avatar size={24} src={project.owner.avatarUrl} alt={project.owner.name} />
            <span className="text-xs font-semibold whitespace-nowrap">{shortDue(due)}</span>
            <span className="max-w-32 truncate text-xs">{project.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
