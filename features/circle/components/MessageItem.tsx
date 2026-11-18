"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ZoneMessage } from "../types";

/** "812 B" / "24.1 KB" / "3.2 MB" for attachment chips and cards. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  keyPrefix: string,
  mentionsEveryone: boolean
) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1).replace(/[.,!?;:]+$/, "");
      const isMention =
        memberNames.includes(name) ||
        (mentionsEveryone && name === "everyone");
      if (isMention) {
        const trailing = part.slice(1 + name.length);
        return (
          <span key={`${keyPrefix}-${i}`}>
            <span className="rounded-md bg-accent/15 px-1 font-semibold text-accent">
              @{name}
            </span>
            {trailing}
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
  mentionsEveryone = false,
}: {
  body: string;
  memberNames: string[];
  mentionsEveryone?: boolean;
}) {
  const segments = body.split(URL_PATTERN);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
      {segments.map((segment, i) => {
        if (i % 2 === 1) {
          const prev = segments[i - 1] ?? "";
          if (/[@a-z0-9]$/i.test(prev)) {
            return (
              <span key={i}>
                {renderTextSegment(segment, memberNames, `s${i}`, mentionsEveryone)}
              </span>
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
          <span key={i}>
            {renderTextSegment(segment, memberNames, `s${i}`, mentionsEveryone)}
          </span>
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
/** Scroll to a message in the loaded history and flash it. */
function jumpToOriginal(id: string) {
  const el = document.getElementById(`zone-msg-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.backgroundColor = "var(--uf-active)";
  window.setTimeout(() => {
    el.style.backgroundColor = "";
  }, 1200);
}

export function MessageItem({
  message,
  memberNames,
  isContinuation,
  groupStart = false,
  onReply,
}: {
  message: ZoneMessage;
  memberNames: string[];
  isContinuation: boolean;
  groupStart?: boolean;
  onReply?: (message: ZoneMessage) => void;
}) {
  const { t } = useLanguage();
  const reply = message.replyTo;
  return (
    <div
      id={`zone-msg-${message.id}`}
      className={`group relative flex gap-3 px-4 py-0.5 transition-colors ${message.mentionsEveryone ? "bg-accent/10" : "hover:bg-bg"} ${groupStart ? "mt-4" : ""}`}
    >
      {onReply && (
        <div className="absolute -top-3 right-4 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label={t("circle.reply")}
            title={t("circle.reply")}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-muted shadow-sm transition-colors hover:text-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="reply" size={15} />
          </button>
        </div>
      )}
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
        {reply ? (
          <button
            type="button"
            onClick={() => jumpToOriginal(reply.id)}
            className="mb-0.5 flex max-w-full cursor-pointer items-center gap-1.5 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Avatar
              src={reply.authorAvatarUrl ?? undefined}
              alt={reply.authorName}
              size={16}
            />
            <span className="shrink-0 text-xs font-semibold text-muted">
              {reply.authorName}
            </span>
            <span className="truncate text-xs text-subtle">
              {reply.content}
            </span>
          </button>
        ) : message.replyToId ? (
          <p className="mb-0.5 text-xs text-subtle italic">
            {t("circle.replyUnavailable")}
          </p>
        ) : null}
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
        {message.content !== "" && (
          <MessageBody
            body={message.content}
            memberNames={memberNames}
            mentionsEveryone={message.mentionsEveryone}
          />
        )}
        {message.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-col items-start gap-1.5 pb-1">
            {message.attachments.map((a) =>
              a.kind === "image" ? (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-line focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.fileName}
                    loading="lazy"
                    className="max-h-64 w-auto max-w-full object-contain"
                  />
                </a>
              ) : (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="file" size={20} className="shrink-0 text-muted" />
                  <span className="min-w-0">
                    <span className="block max-w-64 truncate text-sm font-medium text-ink">
                      {a.fileName}
                    </span>
                    <span className="block text-xs text-subtle">
                      {formatFileSize(a.sizeBytes)} · {t("circle.downloadFile")}
                    </span>
                  </span>
                  <Icon name="download" size={16} className="shrink-0 text-muted" />
                </a>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
