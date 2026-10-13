"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { ThreadApplication } from "../types";

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  accepted: { label: "Accepted", className: "bg-accent text-ink" },
  declined: { label: "Declined", className: "bg-placeholder text-muted" },
  withdrawn: { label: "Withdrawn", className: "bg-placeholder text-muted" },
};

/**
 * The application card from Figma 386:5 — it rides inside the message
 * stack of a thread. Incoming applications (someone applied to MY
 * project) get Accept/Decline while pending; outgoing ones (I applied
 * to theirs) just show where the application stands.
 */
export function ApplicationCard({
  application,
  onResolve,
}: {
  application: ThreadApplication;
  onResolve?: (status: "accepted" | "declined") => void;
}) {
  const { direction, status } = application;
  const chip =
    status === "pending" && direction === "outgoing"
      ? { label: "Pending owner review", className: "bg-bg text-muted" }
      : STATUS_CHIP[status];

  return (
    <div className="flex w-56 flex-col gap-1.5">
      <span className="text-xs text-muted">
        {direction === "incoming" ? "Application received" : "Application sent"}
      </span>
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-base leading-snug font-bold text-ink">
            {application.projectTitle}
          </p>
          <p className="text-sm text-muted">{application.projectMeta}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-ink">
          <Icon name="calendar" size={16} className="text-muted" />
          Due to: {application.dueLabel}
        </div>
        <div className="h-px w-full bg-placeholder" />
        <div className="flex items-center gap-2">
          <span className="flex -space-x-2">
            <Avatar size={24} alt="" className="ring-2 ring-surface" />
            <Avatar size={24} alt="" className="ring-2 ring-surface" />
          </span>
          <span className="text-sm font-medium text-ink">
            {application.slotsLabel}
          </span>
        </div>
        {direction === "incoming" && status === "pending" && onResolve ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onResolve("declined")}
              className="flex-1 cursor-pointer rounded-full border border-line bg-surface py-2 text-sm font-medium text-ink transition-colors hover:bg-bg"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => onResolve("accepted")}
              className="flex-1 cursor-pointer rounded-full bg-accent py-2 text-sm font-medium text-ink transition-opacity hover:opacity-85"
            >
              Accept
            </button>
          </div>
        ) : chip ? (
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${chip.className}`}
          >
            {chip.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
