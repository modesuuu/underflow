"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { CircleZone, ZoneMessage } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const MAX_LENGTH = 2000;
const COUNT_FROM = 1800;

/**
 * The zone composer, styled after the Inbox composer: a floating
 * pill input on the chat background with a separate round send
 * button. Enter submits the form and sends. A character counter
 * appears near the 2000 limit (the backend enforces the same cap).
 * Zones the member cannot post in (announcements for non-owners)
 * get the read-only bar instead, mirroring the backend's 403.
 */
export function Composer({
  zone,
  onSend,
  replyingTo = null,
  onCancelReply,
}: {
  zone: CircleZone;
  onSend: (content: string, replyToId?: string | null) => Promise<void>;
  replyingTo?: ZoneMessage | null;
  onCancelReply?: () => void;
}) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reply mode pulls the keyboard straight back to the composer.
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  if (!zone.memberCanPost) {
    return (
      <div className="shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
        <p className="flex items-center gap-2 rounded-full bg-bg px-4 py-2.5 text-sm text-muted">
          <Icon name="lock" size={13} className="shrink-0" />
          {t("circle.zoneReadOnly")}
        </p>
      </div>
    );
  }

  const submit = async () => {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await onSend(content, replyingTo?.id ?? null);
      setValue("");
    } catch {
      // Keep the draft so the user can retry without retyping.
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      className="shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-bg px-3 py-2">
          <Icon name="reply" size={14} className="shrink-0 text-subtle" />
          <p className="min-w-0 flex-1 truncate text-xs text-muted">
            {t("circle.replyingTo", { name: replyingTo.authorName })}
            <span className="text-subtle"> Â· {replyingTo.content}</span>
          </p>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label={t("circle.cancelReply")}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-line/40 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-bg px-4 py-2 transition-shadow focus-within:ring-2 focus-within:ring-accent">
          <label className="sr-only" htmlFor={`circle-composer-${zone.id}`}>
            {t("circle.messageChannelLabel", { channel: zone.title })}
          </label>
          <input
            id={`circle-composer-${zone.id}`}
            type="text"
            value={value}
            maxLength={MAX_LENGTH}
            ref={inputRef}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && replyingTo) onCancelReply?.();
            }}
            placeholder={
              zone.title === "announcements"
                ? t("circle.announcementPlaceholder")
                : t("circle.messageChannelLabel", { channel: zone.title })
            }
            className="h-8 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          {value.length >= COUNT_FROM && (
            <span className="shrink-0 text-xs text-subtle">
              {value.length} / {MAX_LENGTH}
            </span>
          )}
        </div>
        <button
          type="submit"
          aria-label={t("circle.sendMessage")}
          disabled={!value.trim() || sending}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="send" size={20} />
        </button>
      </div>
      {failed && (
        <p className="pt-2 text-xs text-badge">{t("circle.sendFailed")}</p>
      )}
    </form>
  );
}
