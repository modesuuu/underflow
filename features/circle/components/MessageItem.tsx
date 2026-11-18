"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { ZoneMessage } from "../types";

/** "19:04" from a backend DATETIME string (parsed as local time). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Render message text with @mentions of members highlighted. */
export function MessageBody({
  body,
  memberNames,
}: {
  body: string;
  memberNames: string[];
}) {
  const parts = body.split(/(\s+)/);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1).replace(/[.,!?;:]+$/, "");
          if (memberNames.includes(name)) {
            return (
              <span key={i} className="font-semibold text-accent">
                {part}
              </span>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

/**
 * One message row (Circle Phase 2). A continuation row (same author,
 * same day, < 5 minutes after the previous message) drops the
 * avatar + name header and shows the time on hover instead.
 * Reactions / pin / reply / edit land in Phase 3.
 */
export function MessageItem({
  message,
  memberNames,
  isContinuation,
}: {
  message: ZoneMessage;
  memberNames: string[];
  isContinuation: boolean;
}) {
  return (
    <div className="group relative flex gap-3 px-4 py-0.5 transition-colors hover:bg-bg">
      <div className="flex w-9 shrink-0 justify-center">
        {isContinuation ? (
          <span className="pt-1 text-[10px] leading-none text-subtle opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <Avatar
            src={message.authorAvatarUrl ?? undefined}
            alt={message.authorName}
            size={36}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">
              {message.authorName}
            </span>
            <span className="text-xs text-subtle">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        <MessageBody body={message.content} memberNames={memberNames} />
      </div>
    </div>
  );
}
