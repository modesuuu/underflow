"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { sendMessage } from "../store";
import { formatBytes, truncateMiddle } from "./MessageItem";
import type { ChannelId, CircleAttachment, CircleMember, CircleMessage } from "../types";

const MAX_LENGTH = 2000;
const COUNT_FROM = 1800;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * The channel composer (spec §5): Enter sends, Shift+Enter newline,
 * auto-grow to 5 rows, count from 1800/2000, @mention picker, local
 * attachments (max 5 files, 5 MB each — the upload contract's client
 * limits; files are NOT uploaded in V1: TODO(backend) POST /api/upload).
 * In #announcements non-owners get the read-only bar instead.
 */
export function Composer({
  projectId,
  channelId,
  canPost,
  members,
  replyTo,
  replyAuthor,
  onClearReply,
}: {
  projectId: string;
  channelId: ChannelId;
  canPost: boolean;
  members: CircleMember[];
  replyTo: CircleMessage | null;
  replyAuthor: CircleMember | undefined;
  onClearReply: () => void;
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<CircleAttachment[]>([]);
  const [attachError, setAttachError] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  useEffect(() => {
    if (replyTo) areaRef.current?.focus();
  }, [replyTo]);

  // The active @mention query: an @token at the end of the text.
  const mentionQuery = useMemo(() => {
    const match = value.match(/(?:^|\s)@(\S*)$/);
    return match ? match[1] : null;
  }, [value]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    return members
      .filter(
        (m) =>
          m.userId !== "me" &&
          m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
      )
      .slice(0, 6);
  }, [members, mentionQuery]);

  const pickerOpen = mentionQuery !== null && mentionCandidates.length > 0;

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery]);

  if (!canPost) {
    return (
      <div className="shrink-0 px-4 pb-4">
        <p className="rounded-full bg-bg px-4 py-3 text-sm text-muted">
          Only the project owner can post in #announcements.
        </p>
      </div>
    );
  }

  const pickMention = (member: CircleMember) => {
    setValue((current) =>
      current.replace(/(?:^|\s)@(\S*)$/, (whole) => {
        const lead = whole.startsWith("@") ? "" : " ";
        return `${lead}@${member.name} `;
      }),
    );
    areaRef.current?.focus();
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = [...files];
    const valid = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
    const room = MAX_FILES - attachments.length;
    if (valid.length !== incoming.length || incoming.length > room) {
      setAttachError(true);
    } else {
      setAttachError(false);
    }
    const next = valid.slice(0, Math.max(0, room)).map((f) => ({
      name: f.name,
      sizeBytes: f.size,
    }));
    if (next.length > 0) setAttachments((current) => [...current, ...next]);
  };

  const submit = () => {
    if (!value.trim() && attachments.length === 0) return;
    sendMessage(projectId, channelId, {
      body: value,
      replyToId: replyTo?.id,
      attachments,
    });
    setValue("");
    setAttachments([]);
    setAttachError(false);
    onClearReply();
  };

  return (
    <form
      className="relative shrink-0 px-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {pickerOpen && (
        <div className="absolute right-4 bottom-full left-4 z-20 mb-1 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_16px_40px_-12px_rgba(var(--uf-shadow-rgb),0.25)]">
          {mentionCandidates.map((member, i) => (
            <button
              key={member.userId}
              type="button"
              onClick={() => pickMention(member)}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                i === mentionIndex ? "bg-bg" : ""
              }`}
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-bg text-xs font-medium text-ink">
                {member.name.charAt(0)}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-ink">
                {member.name}
              </span>
              <span className="text-xs text-subtle">{member.role}</span>
            </button>
          ))}
        </div>
      )}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-bg px-3 py-2">
          <Icon name="reply" size={14} className="shrink-0 text-subtle" />
          <span className="min-w-0 flex-1 truncate text-xs text-muted">
            Replying to{" "}
            <span className="font-semibold text-ink">
              {replyAuthor?.name ?? "Unknown"}
            </span>{" "}
            · {replyTo.body}
          </span>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={onClearReply}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-subtle transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      )}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((file) => (
            <span
              key={file.name}
              className="flex items-center gap-2 rounded-full bg-bg py-1 pr-1.5 pl-3"
            >
              <Icon name="file" size={14} className="text-subtle" />
              <span className="text-xs font-medium text-ink">
                {truncateMiddle(file.name, 24)}
              </span>
              <span className="text-xs text-subtle">{formatBytes(file.sizeBytes)}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((f) => f.name !== file.name),
                  )
                }
                className="flex size-5 cursor-pointer items-center justify-center rounded-full text-subtle transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-[24px] bg-bg p-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          aria-label="Attach files"
          onClick={() => fileRef.current?.click()}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Icon name="paperclip" size={17} />
        </button>
        <label className="sr-only" htmlFor={`circle-composer-${channelId}`}>
          Message #{channelId}
        </label>
        <textarea
          id={`circle-composer-${channelId}`}
          ref={areaRef}
          value={value}
          maxLength={MAX_LENGTH}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (pickerOpen) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((i) => (i + 1) % mentionCandidates.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex(
                  (i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length,
                );
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                pickMention(mentionCandidates[mentionIndex]);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setValue((current) => current.replace(/@(\S*)$/, ""));
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            channelId === "announcements" ? "Post an announcement" : "Message #general"
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
          aria-label="Send message"
          disabled={!value.trim() && attachments.length === 0}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="send" size={16} />
        </button>
      </div>
      {attachError && (
        <p className="pt-2 text-xs text-badge">Up to 5 files, 5 MB each.</p>
      )}
    </form>
  );
}
