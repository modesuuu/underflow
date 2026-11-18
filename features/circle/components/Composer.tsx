"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isImeConfirmingEnter } from "@/lib/keyboard";
import type { CircleZone } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const MAX_LENGTH = 2000;
const COUNT_FROM = 1800;

/**
 * The zone composer (Circle Phase 2): Enter sends, Shift+Enter adds
 * a newline, the textarea auto-grows to 5 rows, and a character
 * counter appears near the 2000 limit (the backend enforces the
 * same cap). Attachments / mentions / replies land in Phase 3.
 * Zones the member cannot post in (announcements for non-owners)
 * get the read-only bar instead, mirroring the backend's 403.
 */
export function Composer({
  zone,
  onSend,
}: {
  zone: CircleZone;
  onSend: (content: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  if (!zone.memberCanPost) {
    return (
      <div className="shrink-0 px-4 pb-4">
        <p className="flex items-center gap-2 rounded-full bg-bg px-4 py-3 text-sm text-muted">
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
      await onSend(content);
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
      className="shrink-0 px-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-end gap-2 rounded-lg bg-bg p-2">
        <label className="sr-only" htmlFor={`circle-composer-${zone.id}`}>
          {t("circle.messageChannelLabel", { channel: zone.title })}
        </label>
        <textarea
          id={`circle-composer-${zone.id}`}
          ref={areaRef}
          value={value}
          maxLength={MAX_LENGTH}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isImeConfirmingEnter(e)) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={
            zone.title === "announcements"
              ? t("circle.announcementPlaceholder")
              : t("circle.messageChannelLabel", { channel: zone.title })
          }
          className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-ink outline-none placeholder:text-subtle"
        />
        {value.length >= COUNT_FROM && (
          <span className="pb-2 text-xs text-subtle">
            {value.length} / {MAX_LENGTH}
          </span>
        )}
        <button
          type="submit"
          aria-label={t("circle.sendMessage")}
          disabled={!value.trim() || sending}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="send" size={16} />
        </button>
      </div>
      {failed && (
        <p className="pt-2 text-xs text-badge">{t("circle.sendFailed")}</p>
      )}
    </form>
  );
}
