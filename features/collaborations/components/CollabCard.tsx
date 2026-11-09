"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
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
 * One person-led card of the collaborations board (redesign v2
 * 2026-11-09, CRM reference): owner avatar, project title, owner
 * role line, skill tags, seat dots, Apply. No cover photo and no
 * description — the reference's lead cards carry people, tags and
 * dots, not artwork. The whole card links to the detail (stretched
 * link); Apply runs inline.
 */
export function CollabCard({ project }: { project: CollabProject }) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const spotsLeft = project.slotsTotal - project.slotsFilled;
  const shownSkills = project.skills.slice(0, 3);
  const extraSkills = project.skills.length - shownSkills.length;
  const seatDots = Array.from({ length: project.slotsTotal }, (_, i) => i < project.slotsFilled);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition-[border-color] duration-200 hover:border-ink/30 sm:p-5">
      {/* Stretched link — whole card clickable, keyboard reachable */}
      <Link
        href={"/collaborations/" + project.id}
        aria-label={"View " + project.title}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Owner + title + save */}
      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <Avatar size={56} src={project.owner.avatarUrl} alt={project.owner.name} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-ink">
            {project.title}
          </h3>
          <p className="line-clamp-1 pt-0.5 text-[13px] text-muted">
            {project.owner.name} · {project.owner.role}
          </p>
          {/* Always rendered: an invisible "Open" pill reserves the
              status row's height on open cards, so every card's
              header is the same height and the divider gap below
              the tags stays identical across the row (it was 0px
              on open cards and 13px on the in-progress card). */}
          <span
            aria-hidden={project.status === "open" ? true : undefined}
            className={
              "mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-bg px-2 py-0.5 text-[11px] font-semibold text-ink" +
              (project.status === "open" ? " invisible" : "")
            }
          >
            <span aria-hidden="true" className={"size-1.5 rounded-full " + STATUS_DOT[project.status]} />
            {STATUS_LABEL[project.status]}
          </span>
        </div>
      </div>

      {/* Skill tags — the reference's Source tags */}
      {project.skills.length > 0 && (
        <div className="pointer-events-none relative z-10 mt-3 mb-3 flex flex-wrap gap-1.5">
          {shownSkills.map((s) => (
            <span key={s.label} className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-muted">
              {s.label}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-subtle">
              +{extraSkills} more
            </span>
          )}
        </div>
      )}

      {/* Footer: seat dots + seats, Apply */}
      <div className="pointer-events-none relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
            {seatDots.map((filled, i) => (
              <span
                key={i}
                className={filled ? "size-2 rounded-full bg-ink" : "size-2 rounded-full bg-placeholder"}
              />
            ))}
          </span>
          <span className="truncate text-xs font-medium text-ink">
            {project.slotsFilled} member{project.slotsFilled === 1 ? "" : "s"}
            {" · "}
            {isFull ? "Full" : spotsLeft + " spot" + (spotsLeft === 1 ? "" : "s") + " left"}
          </span>
        </span>
        <span className="pointer-events-auto shrink-0">
          <CardApply project={project} />
        </span>
      </div>
    </article>
  );
}
