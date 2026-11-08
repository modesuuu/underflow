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

/** Cover photos, one per mock project (generated 2026-11-09, warm
    photographic plates in the v3 language). The mock's `photos`
    field is still token strings ("photo-1"), so the card maps by
    project id instead — the detail page keeps its own photo
    rendering untouched. */
const COVERS: Record<string, string> = {
  "collab-1": "/collab-covers/collab-1.jpg",
  "collab-2": "/collab-covers/collab-2.jpg",
  "collab-3": "/collab-covers/collab-3.jpg",
  "collab-4": "/collab-covers/collab-4.jpg",
  "collab-5": "/collab-covers/collab-5.jpg",
  "collab-6": "/collab-covers/collab-6.jpg",
};

const TYPE_LABEL: Record<CollabProject["type"], string> = {
  coursework: "Coursework",
  portfolio: "Portfolio",
  product: "Product",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
};

const STATUS_DOT: Record<ProjectStatus, string> = {
  open: "bg-accent",
  "in-progress": "bg-ink",
  completed: "bg-subtle",
};

/**
 * Compact apply for the card: the same flow ApplyCta runs on
 * the detail page (message modal → application thread in the
 * Inbox → land there), without the detail page's state machine
 * — after sending, the sender is in the Inbox anyway. Project
 * state (pending/withdraw) lives on the detail page and in
 * My Collaborations.
 */
function CardApply({ project }: { project: CollabProject }) {
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
      slotsLabel: project.slotsFilled + " / " + project.slotsTotal,
      messageText: message.trim(),
    });
    setSending(false);
    setModalOpen(false);
    toast.success("Application sent", {
      description: "Your message is in " + project.owner.name + "'s inbox.",
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
            : "pressable cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
 * One photo-led card of the collaborations river (redesign 2026-11-09,
 * Contra discovery pattern): cover photo, type eyebrow, title,
 * description, skills line, member stack + seats, Apply. The whole
 * card links to the detail (stretched link); Save shortlists the
 * project into the board's Saved view; Apply runs inline.
 */
export function CollabCard({
  project,
  saved,
  onToggleSaved,
}: {
  project: CollabProject;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const spotsLeft = project.slotsTotal - project.slotsFilled;
  const cover = COVERS[project.id];
  const filledMembers = project.members.filter((m) => !m.isOpenSlot);
  const shownSkills = project.skills.slice(0, 3);
  const extraSkills = project.skills.length - shownSkills.length;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color] duration-200 hover:border-ink/30">
      {/* Stretched link — whole card clickable, keyboard reachable */}
      <Link
        href={"/collaborations/" + project.id}
        aria-label={"View " + project.title}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Cover photo */}
      <div className="pointer-events-none relative z-10 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-(--uf-ease-out) group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex aspect-[16/10] w-full items-center justify-center bg-tile">
            <Icon name="image" size={32} className="text-[color:var(--uf-tile-icon)]" />
          </span>
        )}
        {/* Status pill — only when the project is not open; open is
            the default and the Apply button already says so. */}
        {project.status !== "open" && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink">
            <span aria-hidden="true" className={"size-1.5 rounded-full " + STATUS_DOT[project.status]} />
            {STATUS_LABEL[project.status]}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-accent">
            {TYPE_LABEL[project.type]}
          </span>
          <span className="text-[11px] text-subtle">{project.postedAgo}</span>
        </div>
        <h3 className="line-clamp-1 text-lg font-semibold text-ink">
          {project.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-snug text-muted">
          {project.description}
        </p>
        {project.skills.length > 0 && (
          <p className="line-clamp-1 text-[13px] text-muted">
            {shownSkills.map((s) => s.label).join(" · ")}
            {extraSkills > 0 ? " · +" + extraSkills + " more" : ""}
          </p>
        )}
        {/* Footer: members + seats, Save + Apply */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex -space-x-2">
              {filledMembers.map((m) => (
                <Avatar
                  key={m.id}
                  size={24}
                  src={m.avatarUrl}
                  alt={m.name}
                  className="ring-2 ring-surface"
                />
              ))}
            </span>
            <span className="truncate text-xs font-medium text-ink">
              {project.slotsFilled} member{project.slotsFilled === 1 ? "" : "s"}
              {" · "}
              {isFull ? "Full" : spotsLeft + " spot" + (spotsLeft === 1 ? "" : "s") + " left"}
            </span>
          </span>
          <span className="pointer-events-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              aria-label={saved ? "Unsave " + project.title : "Save " + project.title}
              className="cursor-pointer p-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon
                name="bookmark"
                solid={saved}
                size={20}
                className={saved ? "text-ink" : "text-placeholder transition-colors hover:text-subtle"}
              />
            </button>
            <CardApply project={project} />
          </span>
        </div>
      </div>
    </article>
  );
}
