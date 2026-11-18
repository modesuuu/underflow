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

/** Trailing characters that belong to the sentence, not the link. */
function splitTrailingPunct(token: string): [string, string] {
  let end = token.length;
  while (end > 0 && ".,!?;:".includes(token[end - 1])) end--;
  if (end > 0 && token[end - 1] === ")" && !token.slice(0, end).includes("(")) {
    end--;
  }
  return [token.slice(0, end), token.slice(end)];
}

/**
 * Clickable links in chat text: full http(s) URLs, www. addresses,
 * and bare domains on common TLDs (github.com, figma.com/x, ...).
 */
const URL_PATTERN =
  /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|id|dev|app|gg|me|edu|info|xyz)(?:\/[^\s<]*)?)/gi;

/** Render one plain-text segment, highlighting @mentions. */
function renderTextSegment(
  text: string,
  memberNames: string[],
  keyPrefix: string
) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1).replace(/[.,!?;:]+$/, "");
      if (memberNames.includes(name)) {
        return (
          <span key={`${keyPrefix}-${i}`} className="font-semibold text-accent">
            {part}
          </span>
        );
      }
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

/**
 * Render message text with @mentions of members highlighted and
 * links made clickable (new tab, noopener). A domain glued to a
 * word or an @ (an email address) is left as plain text.
 */
export function MessageBody({
  body,
  memberNames,
}: {
  body: string;
  memberNames: string[];
}) {
  const segments = body.split(URL_PATTERN);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
      {segments.map((segment, i) => {
        if (i % 2 === 1) {
          const prev = segments[i - 1] ?? "";
          if (/[@a-z0-9]$/i.test(prev)) {
            return (
              <span key={i}>{renderTextSegment(segment, memberNames, `s${i}`)}</span>
            );
          }
          const [link, trailing] = splitTrailingPunct(segment);
          const href = link.startsWith("http") ? link : `https://${link}`;
          return (
            <span key={i}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium break-all text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
              >
                {link}
              </a>
              {trailing}
            </span>
          );
        }
        return (
          <span key={i}>{renderTextSegment(segment, memberNames, `s${i}`)}</span>
        );
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
  groupStart = false,
}: {
  message: ZoneMessage;
  memberNames: string[];
  isContinuation: boolean;
  groupStart?: boolean;
}) {
  return (
    <div
      className={`group relative flex gap-3 px-4 py-0.5 transition-colors hover:bg-bg ${groupStart ? "mt-4" : ""}`}
    >
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
