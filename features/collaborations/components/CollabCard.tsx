"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Token } from "@astryxdesign/core/Token";
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
 * My Collaborations. The button itself is Astryx's Button:
 * primary while applying is possible, secondary + disabled for
 * every terminal state.
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
      {blocked ? (
        <Button
          label={label}
          variant="secondary"
          size="sm"
          isDisabled
          tooltip={isOwner ? "This is your project" : undefined}
        />
      ) : (
        <Button
          label={label}
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
        />
      )}
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
 * One card of the collaborations board (Astryx rebuild
 * 2026-11-13): the surface is Astryx's Card (its own border,
 * background and container radius), the due/status/skill tags
 * are Astryx Tokens (the design system's tag component — the
 * same treatment the board's Kanban cards got, user order
 * 2026-11-13), and Apply is Astryx's Button. Content
 * anatomy stays the board's: due badge, title, a two-line mini
 * description, skill badges, and a footer with the seat count
 * and Apply. No owner avatar or name on the card — that lives
 * on the detail page. The whole card links to the detail
 * (stretched link); Apply runs inline. Hover lift/shadow still
 * come from .collab-card-live (tokens.css).
 */
export function CollabCard({ project }: { project: CollabProject }) {
  const isFull = project.slotsFilled >= project.slotsTotal;
  const spotsLeft = project.slotsTotal - project.slotsFilled;
  const shownSkills = project.skills.slice(0, 3);
  const extraSkills = project.skills.length - shownSkills.length;
  const hasSkills = project.skills.length > 0;
  const hasDescription = project.description.trim() !== "";

  return (
    <Card
      height="100%"
      padding={5}
      className="collab-card-live group relative flex flex-col"
    >
      {/* Stretched link — whole card clickable, keyboard reachable */}
      <Link
        href={"/collaborations/" + project.id}
        aria-label={"View " + project.title}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      />

      {/* Top row: due badge + status badge. The status badge keeps
          the old reserve trick: on open cards it renders
          invisibly, so every card's top row is the same height. */}
      <div className="pointer-events-none relative z-10 flex items-center justify-between gap-2">
        <Token
          size="sm"
          label={
            project.dueDate
              ? "Due " + formatDueDate(project.dueDate)
              : "No deadline"
          }
        />
        <span
          aria-hidden={project.status === "open" ? true : undefined}
          className={project.status === "open" ? "invisible" : undefined}
        >
          <Token
            size="sm"
            icon={
              <span
                aria-hidden="true"
                className={"size-1.5 rounded-full " + STATUS_DOT[project.status]}
              />
            }
            label={STATUS_LABEL[project.status]}
          />
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

      {/* Skill badges — anchored to the bottom of the card
          above the footer. */}
      {hasSkills && (
        <div className="pointer-events-none relative z-10 mt-auto flex flex-wrap gap-1.5 pt-4">
          {shownSkills.map((s) => (
            <Token key={s.label} size="sm" label={s.label} />
          ))}
          {extraSkills > 0 && (
            <Token size="sm" label={"+" + extraSkills + " more"} />
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
    </Card>
  );
}
