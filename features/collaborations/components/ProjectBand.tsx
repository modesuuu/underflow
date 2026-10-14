"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { resolvePersonId } from "@/features/profile/mock";
import { applyToCollab } from "../api";
import { startApplicationThread } from "@/features/inbox/store";
import { formatDueDate } from "../sort";
import type { CollabProject, ProjectStatus } from "../types";
import { ApplyMessageModal } from "./ApplyMessageModal";

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

/** Same rule as the detail page: mock photo tokens are not URLs. */
function isUrlish(s: string): boolean {
  return /^https?:\/\//.test(s) || s.startsWith("//") || s.startsWith("/");
}

/**
 * Compact apply for the band: the same flow ApplyCta runs on
 * the detail page (message modal → application thread in the
 * Inbox → land there), without the detail page's state machine
 * — after sending, the sender is in the Inbox anyway. Project
 * state (pending/withdraw) lives on the detail page and in
 * My Collaborations.
 */
function BandApply({ project }: { project: CollabProject }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const isFull = project.slotsFilled >= project.slotsTotal;

  const handleSend = async (message: string) => {
    setSending(true);
    // TODO(backend): POST /api/collaborations/:id/apply
    await applyToCollab(project.id);
    startApplicationThread({
      ownerPersonId: resolvePersonId(project.owner.id) ?? null,
      ownerName: project.owner.name,
      projectId: project.id,
      projectTitle: project.title,
      projectMeta: project.subtitle.replace(/\.+$/, ""),
      dueLabel: formatDueDate(project.dueDate),
      slotsLabel: `${project.slotsFilled} / ${project.slotsTotal}`,
      messageText: message.trim(),
    });
    setSending(false);
    setModalOpen(false);
    toast.success("Application sent", {
      description: `Your message is on its way to ${project.owner.name}.`,
    });
    router.push("/inbox");
  };

  return (
    <>
      <button
        type="button"
        disabled={isFull}
        onClick={() => setModalOpen(true)}
        className={
          isFull
            ? "rounded-full bg-placeholder px-4 py-2 text-sm font-semibold text-muted"
            : "pressable cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        }
      >
        {isFull ? "Full" : "Apply"}
      </button>
      {modalOpen && (
        <ApplyMessageModal
          projectTitle={project.title}
          ownerName={project.owner.name}
          roleLabel={project.subtitle
            .replace(/\.+$/, "")
            .replace(/^Need\s+/i, "")}
          sending={sending}
          onClose={() => setModalOpen(false)}
          onSend={handleSend}
        />
      )}
    </>
  );
}

/**
 * One band of the collaborations river. At feed scale the unit
 * is a wide, self-complete band — thumb, brief, seats, owner —
 * not a card that needs a preview pane to explain it. The whole
 * band links to the detail (stretched link); Save shortlists
 * the project into the board's Saved view; Apply runs inline.
 */
export function ProjectBand({
  project,
  saved,
  onToggleSaved,
}: {
  project: CollabProject;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const hero = project.photos[0];

  return (
    <article className="group relative flex gap-4 rounded-2xl bg-bg p-4 transition-[background-color,box-shadow] duration-200 hover:bg-surface hover:shadow-[0_1px_2px_rgba(var(--uf-shadow-rgb),0.05),0_16px_36px_-16px_rgba(var(--uf-shadow-rgb),0.20)]">
      {/* Stretched link — whole band clickable, keyboard reachable */}
      <Link
        href={`/collaborations/${project.id}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Thumb */}
      <div className="pointer-events-none relative z-10 hidden shrink-0 sm:block">
        {hero &&
          (isUrlish(hero) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt=""
              className="size-[84px] rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-[84px] items-center justify-center rounded-xl bg-accent">
              <Icon name="image" size={24} className="text-on-accent/40" />
            </span>
          ))}
      </div>

      {/* Brief */}
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${STATUS_DOT[project.status]}`}
          />
          <span className="text-xs font-medium text-ink">
            {STATUS_LABEL[project.status]}
          </span>
          <span className="text-[11px] text-subtle">{project.postedAgo}</span>
        </div>
        <h3 className="line-clamp-1 text-lg font-semibold text-ink">
          {project.title}
        </h3>
        <p className="line-clamp-1 text-sm text-muted">{project.subtitle}</p>
        {project.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {project.skills.slice(0, 4).map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition-colors duration-200 group-hover:bg-bg"
              >
                {skill.label}
              </span>
            ))}
            {project.skills.length > 4 && (
              <span className="text-[11px] text-subtle">
                +{project.skills.length - 4} more
              </span>
            )}
          </div>
        )}
        {/* Meta: seats meter, due, owner */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5">
          <span className="flex items-center gap-2">
            <span
              className="flex w-24 gap-0.5"
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
            </span>
            <span className="text-xs font-medium text-ink">
              {project.slotsFilled}/{project.slotsTotal} seats
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Icon name="calendar" size={14} />
            Due {formatDueDate(project.dueDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Avatar
              size={20}
              src={project.owner.avatarUrl}
              alt={project.owner.name}
            />
            <span className="text-xs font-medium text-ink">
              {project.owner.name}
            </span>
          </span>
        </div>
      </div>

      {/* Actions — above the stretched link */}
      <div className="pointer-events-none relative z-10 flex shrink-0 flex-col items-end justify-between">
        <button
          type="button"
          onClick={onToggleSaved}
          aria-pressed={saved}
          aria-label={saved ? `Unsave ${project.title}` : `Save ${project.title}`}
          className="pointer-events-auto cursor-pointer p-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Icon
            name="bookmark"
            solid={saved}
            size={20}
            className={saved ? "text-ink" : "text-placeholder transition-colors hover:text-subtle"}
          />
        </button>
        <span className="pointer-events-auto">
          <BandApply project={project} />
        </span>
      </div>
    </article>
  );
}
