"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { applyToCollab, backendErrorMessage } from "../api";
import { useSessionUser } from "@/features/auth/store";
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
  const sessionUser = useSessionUser();
  const isOwner =
    sessionUser !== null && sessionUser.id === project.owner.id;
  const isFull = project.slotsFilled >= project.slotsTotal;
  // The viewer's own application decides the button (mirrors the
  // detail page's ApplyCta states): once applied, the card never
  // offers Apply again — Pending while it waits, Joined once in,
  // Declined when the owner passed. Withdrawn frees it up again.
  const myApplication = project.myApplication ?? null;
  const applied = myApplication === "pending";
  const joined = myApplication === "accepted";
  const declined = myApplication === "declined";
  const blocked = isOwner || applied || joined || declined || isFull;
  const label = isOwner
    ? "This is your project"
    : joined
      ? "Joined"
      : applied
        ? "Pending"
        : declined
          ? "Declined"
          : isFull
            ? "Full"
            : "Apply";

  const handleSend = async (message: string) => {
    setSending(true);
    try {
      const result = await applyToCollab(project.id, message);
      setModalOpen(false);
      if (result.alreadyApplied) {
        // 409 Already applied: the application already exists, so
        // no second inbox thread - just go to the existing one.
        toast("Application already sent", {
          description:
            "Your application to " + project.title + " is pending review.",
        });
        router.push("/inbox");
        return;
      }
      await startApplicationThread({
        ownerPersonId: project.owner.id,
        ownerName: project.owner.name,
        projectId: project.id,
        projectTitle: project.title,
        projectMeta: project.subtitle.replace(/\.+$/, ""),
        dueLabel: formatDueDate(project.dueDate),
        slotsLabel: project.slotsFilled + " / " + project.slotsTotal,
        messageText: message.trim(),
      });
      toast.success("Application sent", {
        description: "Your message is in " + project.owner.name + "'s inbox.",
      });
      router.push("/inbox");
    } catch (err) {
      toast.error("Application failed", {
        description: backendErrorMessage(err),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={blocked}
        title={isOwner ? "This is your project" : undefined}
        onClick={() => setModalOpen(true)}
        className={
          blocked
            ? "rounded-full bg-placeholder px-5 py-2 text-[13px] font-medium text-muted"
            : "pressable cursor-pointer rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        }
      >
        {label}
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
 * One card of the collaborations board (redesign 2026-11-12,
 * structure borrowed from a job-board card, colors from the
 * app's own theme): due-date pill, title, a two-line mini
 * description, outlined skill tags, and a footer with the seat
 * count and the Apply pill. No owner avatar or name on the
 * card — that lives on the detail page. The card background
 * comes from .collab-card (tokens.css): the surface color in
 * light; in dark the page ground goes black and the card
 * itself carries the brand green. The whole card links to the
 * detail (stretched link); Apply runs inline.
 */
export function CollabCard({ project }: { project: CollabProject }) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const spotsLeft = project.slotsTotal - project.slotsFilled;
  const shownSkills = project.skills.slice(0, 3);
  const extraSkills = project.skills.length - shownSkills.length;
  const hasSkills = project.skills.length > 0;
  const hasDescription = project.description.trim() !== "";

  return (
    <article className="collab-card collab-card-live group relative flex h-full flex-col rounded-lg border border-line p-5">
      {/* Stretched link — whole card clickable, keyboard reachable */}
      <Link
        href={"/collaborations/" + project.id}
        aria-label={"View " + project.title}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Top row: due pill + status pill. The status pill keeps
          the old reserve trick: on open cards it renders
          invisibly, so every card's top row is the same height. */}
      <div className="pointer-events-none relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-placeholder px-2.5 py-1 text-[11px] font-semibold text-accent">
          {project.dueDate
            ? "Due " + formatDueDate(project.dueDate)
            : "No deadline"}
        </span>
        <span
          aria-hidden={project.status === "open" ? true : undefined}
          className={
            "inline-flex items-center gap-1.5 rounded-full bg-placeholder px-2 py-0.5 text-[11px] font-semibold text-ink" +
            (project.status === "open" ? " invisible" : "")
          }
        >
          <span aria-hidden="true" className={"size-1.5 rounded-full " + STATUS_DOT[project.status]} />
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      {/* Title + mini description */}
      <h3 className="pointer-events-none relative z-10 mt-3.5 line-clamp-2 text-xl leading-snug font-semibold text-ink">
        {project.title}
      </h3>
      {hasDescription && (
        <p className="pointer-events-none relative z-10 mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {project.description}
        </p>
      )}

      {/* Skill tags — outlined pills, anchored to the bottom
          of the card above the footer. */}
      {hasSkills && (
        <div className="pointer-events-none relative z-10 mt-auto flex flex-wrap gap-1.5 pt-4">
          {shownSkills.map((s) => (
            <span key={s.label} className="rounded-full border border-line/50 px-2.5 py-1 text-[11px] font-medium text-ink">
              {s.label}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full border border-line/50 px-2.5 py-1 text-[11px] font-medium text-muted">
              +{extraSkills} more
            </span>
          )}
        </div>
      )}

      {/* Footer: seats + spots, Apply */}
      <div
        className={
          "pointer-events-none relative z-10 flex items-center justify-between gap-3 border-t border-line/60 pt-3.5" +
          (hasSkills ? " mt-3.5" : " mt-auto")
        }
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-ink">
            {project.slotsFilled}/{project.slotsTotal} member
            {project.slotsTotal === 1 ? "" : "s"}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {isFull
              ? "Team is full"
              : spotsLeft + " spot" + (spotsLeft === 1 ? "" : "s") + " left"}
          </span>
        </span>
        <span className="pointer-events-auto shrink-0">
          <CardApply project={project} />
        </span>
      </div>
    </article>
  );
}
