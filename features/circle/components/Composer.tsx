"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import type {
  CircleMember,
  CircleZone,
  ZoneAttachmentInput,
  ZoneMessage,
} from "../types";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  attachmentKindForFile,
  uploadZoneAttachment,
} from "../api";
import { formatFileSize } from "./MessageItem";
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
  members = [],
  canEveryone = false,
}: {
  zone: CircleZone;
  onSend: (
    content: string,
    replyToId?: string | null,
    attachments?: ZoneAttachmentInput[]
  ) => Promise<void>;
  replyingTo?: ZoneMessage | null;
  onCancelReply?: () => void;
  members?: CircleMember[];
  canEveryone?: boolean;
}) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending attachments: validated on pick (type, 5 MB, max 3) and
  // uploaded only when the message is sent, so an abandoned draft
  // never leaves files behind on the project account.
  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    setFileError(null);
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= MAX_ATTACHMENTS) {
        setFileError(t("circle.attachmentMaxReached"));
        continue;
      }
      if (!attachmentKindForFile(f)) {
        setFileError(t("circle.attachmentTypeNotAllowed"));
        continue;
      }
      if (f.size > MAX_ATTACHMENT_BYTES) {
        setFileError(t("circle.attachmentTooLarge"));
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  // Reply mode pulls the keyboard straight back to the composer.
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  // @-mention autocomplete (Discord-style): while the caret sits
  // right after an @word, offer the circle members it matches,
  // plus @everyone when the user is the owner. Enter, Tab or a
  // click inserts the tag; Escape dismisses the menu first.
  type MentionCandidate =
    | { kind: "everyone" }
    | { kind: "user"; name: string; avatarUrl?: string };
  const [mention, setMention] = useState<{
    start: number;
    query: string;
  } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const candidates: MentionCandidate[] = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    const out: MentionCandidate[] = [];
    if (canEveryone && "everyone".startsWith(q)) {
      out.push({ kind: "everyone" });
    }
    for (const m of members) {
      if (out.length >= 8) break;
      if (m.name.toLowerCase().includes(q)) {
        out.push({ kind: "user", name: m.name, avatarUrl: m.avatarUrl });
      }
    }
    return out;
  }, [mention, members, canEveryone]);

  const detectMention = (text: string, caret: number) => {
    const upto = text.slice(0, caret);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(upto);
    const next = match
      ? { start: caret - match[1].length - 1, query: match[1] }
      : null;
    if (next?.start !== mention?.start || next?.query !== mention?.query) {
      setMention(next);
      if (next) setMentionIndex(0);
    }
  };

  const pickMention = (c: MentionCandidate) => {
    if (!mention) return;
    const insert = c.kind === "everyone" ? "@everyone " : `@${c.name} `;
    const next = (
      value.slice(0, mention.start) +
      insert +
      value.slice(mention.start + mention.query.length + 1)
    ).slice(0, MAX_LENGTH);
    setValue(next);
    setMention(null);
    const pos = mention.start + insert.length;
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

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
    if ((!content && files.length === 0) || sending) return;
    setSending(true);
    setFailed(false);
    setUploadFailed(false);
    try {
      let attachments: ZoneAttachmentInput[] = [];
      if (files.length > 0) {
        try {
          for (const f of files) {
            attachments.push(await uploadZoneAttachment(f));
          }
        } catch {
          // Keep the draft and the picked files so the user can retry.
          setUploadFailed(true);
          return;
        }
      }
      await onSend(content, replyingTo?.id ?? null, attachments);
      setValue("");
      setFiles([]);
      setMention(null);
    } catch {
      // Keep the draft so the user can retry without retyping.
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      className="relative shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {mention && candidates.length > 0 && (
        <ul
          role="listbox"
          aria-label={t("circle.mentionLabel")}
          className="absolute inset-x-4 bottom-full z-20 mb-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lg sm:inset-x-6"
        >
          {candidates.map((c, i) => (
            <li key={c.kind === "everyone" ? "everyone" : c.name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMention(c);
                }}
                onMouseEnter={() => setMentionIndex(i)}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm ${
                  i === mentionIndex ? "bg-bg" : ""
                }`}
              >
                {c.kind === "everyone" ? (
                  <>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
                      @
                    </span>
                    <span className="font-semibold text-ink">everyone</span>
                    <span className="truncate text-xs text-subtle">
                      {t("circle.mentionEveryoneHint")}
                    </span>
                  </>
                ) : (
                  <>
                    <Avatar src={c.avatarUrl} alt={c.name} size={24} />
                    <span className="font-medium text-ink">{c.name}</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
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
      {files.length > 0 && (
        <div className="mb-2">
          <ul className="flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${f.size}-${f.lastModified}`}
                className="flex max-w-full items-center gap-2 rounded-lg bg-bg py-1.5 pr-1.5 pl-2.5 text-xs text-ink"
              >
                <Icon name="file" size={14} className="shrink-0 text-muted" />
                <span className="max-w-44 truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-subtle">
                  {formatFileSize(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles(files.filter((_, j) => j !== i))
                  }
                  aria-label={t("circle.removeFile")}
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-line/40 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="x" size={12} />
                </button>
              </li>
            ))}
          </ul>
          <p className="pt-1.5 text-[11px] text-subtle">
            {t("circle.filesHint")}
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.md,.txt,.csv,.ppt,.pptx,.zip"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-bg px-4 py-2 transition-shadow focus-within:ring-2 focus-within:ring-accent">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("circle.attachFiles")}
            title={t("circle.attachFiles")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-line/40 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="paperclip" size={17} />
          </button>
          <label className="sr-only" htmlFor={`circle-composer-${zone.id}`}>
            {t("circle.messageChannelLabel", { channel: zone.title })}
          </label>
          <input
            id={`circle-composer-${zone.id}`}
            type="text"
            value={value}
            maxLength={MAX_LENGTH}
            ref={inputRef}
            onChange={(e) => {
              setValue(e.target.value);
              detectMention(
                e.target.value,
                e.target.selectionStart ?? e.target.value.length
              );
            }}
            onSelect={(e) => {
              const el = e.target as HTMLInputElement;
              detectMention(el.value, el.selectionStart ?? el.value.length);
            }}
            onKeyDown={(e) => {
              if (mention && candidates.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => (i + 1) % candidates.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex(
                    (i) => (i - 1 + candidates.length) % candidates.length
                  );
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  pickMention(candidates[mentionIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMention(null);
                  return;
                }
              }
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
          disabled={(!value.trim() && files.length === 0) || sending}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="send" size={20} />
        </button>
      </div>
      {fileError && (
        <p className="pt-2 text-xs text-badge">{fileError}</p>
      )}
      {sending && files.length > 0 && (
        <p className="pt-2 text-xs text-subtle">{t("circle.uploading")}</p>
      )}
      {uploadFailed && (
        <p className="pt-2 text-xs text-badge">
          {t("circle.attachmentUploadFailed")}
        </p>
      )}
      {failed && (
        <p className="pt-2 text-xs text-badge">{t("circle.sendFailed")}</p>
      )}
    </form>
  );
}
