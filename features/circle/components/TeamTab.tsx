"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useSessionUser } from "@/features/auth/store";
import type { CircleMember } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Team list (Circle Phase 1): real members from the backend, owner
 * first. No presence dots — presence arrives with the realtime phase.
 */
function MemberRow({
  member,
  isMe,
}: {
  member: CircleMember;
  isMe: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5">
      <Avatar alt={member.name} size={32} src={member.avatarUrl} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-ink">
          {member.name}
          {isMe && (
            <span className="font-normal text-subtle">
              {" "}
              {t("circle.you")}
            </span>
          )}
        </span>
        <span className="truncate text-xs text-muted">
          {member.isOwner ? t("circle.roleOwner") : t("circle.roleMember")}
        </span>
      </div>
    </div>
  );
}

export function TeamTab({ members }: { members: CircleMember[] }) {
  const { t } = useLanguage();
  const sessionUser = useSessionUser();
  const owner = members.filter((m) => m.isOwner);
  const rest = members.filter((m) => !m.isOwner);
  return (
    <div className="flex flex-col py-3">
      <span className="px-4 pb-1 text-xs font-semibold text-subtle">
        {t("admin.ownerPill")}
      </span>
      {owner.map((member) => (
        <MemberRow
          key={member.userId}
          member={member}
          isMe={sessionUser?.id === member.userId}
        />
      ))}
      {rest.length > 0 && (
        <>
          <span className="px-4 pt-4 pb-1 text-xs font-semibold text-subtle">
            {t("admin.thMembers")}
          </span>
          {rest.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              isMe={sessionUser?.id === member.userId}
            />
          ))}
        </>
      )}
    </div>
  );
}
