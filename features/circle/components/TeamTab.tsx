"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { CircleMember, Presence } from "../types";

/**
 * Presence colors use existing tokens only (spec §6): online = accent,
 * idle = subtle, offline = line. No new hex values.
 */
const PRESENCE_CLASS: Record<Presence, string> = {
  online: "bg-accent",
  idle: "bg-subtle",
  offline: "bg-line",
};

const PRESENCE_LABEL: Record<Presence, string> = {
  online: "Online",
  idle: "Idle",
  offline: "Offline",
};

function MemberRow({ member }: { member: CircleMember }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5">
      <span className="relative shrink-0">
        <Avatar alt={member.name} size={32} />
        <span
          className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-surface ${PRESENCE_CLASS[member.presence]}`}
          role="img"
          aria-label={PRESENCE_LABEL[member.presence]}
        />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-ink">
          {member.name}
          {member.userId === "me" && (
            <span className="font-normal text-subtle"> (You)</span>
          )}
        </span>
        <span className="truncate text-xs text-muted">{member.role}</span>
      </div>
    </div>
  );
}

export function TeamTab({ members }: { members: CircleMember[] }) {
  const owner = members.filter((m) => m.isOwner);
  const rest = members.filter((m) => !m.isOwner);
  return (
    <div className="flex flex-col py-3">
      <span className="px-4 pb-1 text-xs font-semibold text-subtle">Owner</span>
      {owner.map((member) => (
        <MemberRow key={member.userId} member={member} />
      ))}
      <span className="px-4 pt-4 pb-1 text-xs font-semibold text-subtle">
        Members
      </span>
      {rest.map((member) => (
        <MemberRow key={member.userId} member={member} />
      ))}
    </div>
  );
}
