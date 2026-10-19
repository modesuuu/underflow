"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { toggleReaction } from "../store";
import type { CircleMember, CircleMessage } from "../types";

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Middle-truncate long file names: start…end (spec §10 worst cases). */
export function truncateMiddle(name: string, max = 30): string {
  if (name.length <= max) return name;
  const head = Math.ceil((max - 1) * 0.6);
  const tail = Math.floor((max - 1) * 0.4);
  return `${name.slice(0, head)}…${name.slice(name.length - tail)}`;
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

export function ReplyQuote({
  target,
  targetAuthor,
}: {
  target: CircleMessage | undefined;
  targetAuthor: CircleMember | undefined;
}) {
  if (!target) {
    return (
      <div className="mb-1 border-l-2 border-line pl-2 text-xs text-subtle">
        Original message was deleted.
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(`circle-msg-${target.id}`)
          ?.scrollIntoView({ block: "center", behavior: "smooth" })
      }
      className="mb-1 block w-full cursor-pointer truncate border-l-2 border-line pl-2 text-left text-xs text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <span className="font-semibold">{targetAuthor?.name ?? "Unknown"}</span>{" "}
      {target.body}
    </button>
  );
}

/**
 * One message row. The group header (avatar, name, time) is rendered by
 * MessageGroup for the first message of a group; continuation rows keep
 * the same left gutter and reveal their time on hover (spec §5.1).
 */
export function MessageItem({
  projectId,
  message,
  author,
  membersById,
  messagesById,
  isContinuation,
}: {
  projectId: string;
  message: CircleMessage;
  author: CircleMember | undefined;
  membersById: Map<string, CircleMember>;
  messagesById: Map<string, CircleMessage>;
  isContinuation: boolean;
}) {
  const memberNames = [...membersById.values()].map((m) => m.name);
  return (
    <div
      id={`circle-msg-${message.id}`}
      className="group relative flex gap-3 px-4 py-0.5 transition-colors hover:bg-bg"
    >
      <div className="flex w-9 shrink-0 justify-center">
        {isContinuation ? (
          <span className="pt-1 text-[10px] leading-none text-subtle opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <Avatar alt={author?.name ?? "?"} size={36} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">
              {author?.name ?? "Unknown"}
            </span>
            <span className="text-xs text-subtle">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        {message.pinned && (
          <div className="flex items-center gap-1 text-xs text-subtle">
            <Icon name="pin" size={12} />
            Pinned
          </div>
        )}
        {message.replyToId && (
          <ReplyQuote
            target={messagesById.get(message.replyToId)}
            targetAuthor={
              message.replyToId
                ? membersById.get(messagesById.get(message.replyToId)?.authorId ?? "")
                : undefined
            }
          />
        )}
        <MessageBody body={message.body} memberNames={memberNames} />
        {message.editedAt && (
          <span className="text-xs text-subtle">(edited)</span>
        )}
        {message.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1.5">
            {message.attachments.map((file) => (
              <div
                key={file.name}
                className="flex max-w-xs items-center gap-2.5 rounded-lg bg-bg px-3 py-2"
              >
                <Icon name="file" size={18} className="shrink-0 text-subtle" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium text-ink">
                    {truncateMiddle(file.name)}
                  </span>
                  <span className="text-xs text-subtle">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                aria-pressed={reaction.reactedByMe}
                aria-label={`${reaction.emoji} reaction, ${reaction.count}`}
                onClick={() => toggleReaction(projectId, message.id, reaction.emoji)}
                className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  reaction.reactedByMe
                    ? "bg-accent/15 font-medium text-ink ring-1 ring-accent"
                    : "bg-bg text-muted ring-1 ring-line hover:text-ink"
                }`}
              >
                <span aria-hidden>{reaction.emoji}</span>
                {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
