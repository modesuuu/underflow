import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { resolvePersonId } from "@/features/profile/mock";
import { formatDueDate } from "../sort";
import type { CollabProject } from "../types";
import { ApplyCta } from "./ApplyCta";
import { STATUS_DOT, STATUS_LABEL } from "./ProjectIndexRow";

/** Same rule as the detail page: mock photo tokens are not URLs. */
function isUrlish(s: string): boolean {
  return /^https?:\/\//.test(s) || s.startsWith("//") || s.startsWith("/");
}

/**
 * The preview pane of the collaborations index: the selected
 * project's brief without leaving the board — photos, the
 * pitch, the work, the seats, the team, and the real Apply
 * flow (the same ApplyCta the detail page uses). Content swaps
 * with a short rise-and-fade keyed on the project id; the pane
 * itself never moves.
 */
export function ProjectPreview({ project }: { project: CollabProject }) {
  const router = useRouter();
  const openSeats = Math.max(0, project.slotsTotal - project.slotsFilled);
  const isFull = openSeats === 0;
  const photos = project.photos.slice(0, 4).map((url, i) => ({
    id: `${project.id}-photo-${i + 1}`,
    url: isUrlish(url) ? url : undefined,
    alt: `Project photo ${i + 1}`,
  }));
  const realMembers = project.members.filter((m) => !m.isOpenSlot);

  return (
    <div
      key={project.id}
      className="flex flex-col gap-5 [animation:uf-card-in_280ms_var(--uf-ease-out)_backwards]"
    >
      {project.photos.length > 0 && (
        <PhotoGrid
          photos={photos}
          onPhotoClick={() => router.push(`/collaborations/${project.id}`)}
        />
      )}

      {/* Status + title */}
      <div className="flex flex-col gap-2">
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
        <h2 className="text-2xl leading-tight font-semibold text-ink">
          {project.title}
        </h2>
        <p className="text-sm text-muted">{project.subtitle}</p>
      </div>

      <p className="line-clamp-4 text-sm leading-relaxed text-muted">
        {project.description}
      </p>

      {/* The work, first three items */}
      {project.workItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink">
            What you&rsquo;ll work on
          </h3>
          <ul className="flex flex-col gap-1.5">
            {project.workItems.slice(0, 3).map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-ink" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
            >
              {skill.label}
            </span>
          ))}
        </div>
      )}

      {/* Capacity */}
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

      {/* Team */}
      <div className="flex items-center gap-3">
        <span className="flex">
          {realMembers.slice(0, 4).map((member, i) => (
            <Avatar
              key={member.id}
              size={28}
              src={member.avatarUrl}
              alt={member.name}
              className={i > 0 ? "-ml-2 ring-2 ring-bg" : "ring-2 ring-bg"}
            />
          ))}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] leading-tight font-medium text-ink">
            {project.owner.name}
          </span>
          <span className="truncate text-[11px] leading-tight text-subtle">
            {project.owner.role}
          </span>
        </span>
      </div>

      <div className="h-px w-full bg-placeholder" aria-hidden="true" />

      {/* The real apply flow, same as the detail page */}
      <ApplyCta
        projectId={project.id}
        projectTitle={project.title}
        projectMeta={project.subtitle.replace(/\.+$/, "")}
        dueLabel={formatDueDate(project.dueDate)}
        slotsLabel={`${project.slotsFilled} / ${project.slotsTotal}`}
        ownerName={project.owner.name}
        ownerPersonId={resolvePersonId(project.owner.id) ?? null}
        slotsFull={isFull}
      />
      <Link
        href={`/collaborations/${project.id}`}
        className="-mt-2 text-center text-sm font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        View full project
      </Link>
    </div>
  );
}
