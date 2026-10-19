"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { sendMessage } from "../store";
import type { ChannelId } from "../types";

const MAX_LENGTH = 2000;
const COUNT_FROM = 1800;

/**
 * The channel composer (spec §5): Enter sends, Shift+Enter newline,
 * auto-grow up to 5 rows, character count appears only from 1800 of
 * 2000. In #announcements non-owners get the read-only bar instead.
 */
export function Composer({
  projectId,
  channelId,
  canPost,
}: {
  projectId: string;
  channelId: ChannelId;
  canPost: boolean;
}) {
  const [value, setValue] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  if (!canPost) {
    return (
      <div className="shrink-0 px-4 pb-4">
        <p className="rounded-full bg-bg px-4 py-3 text-sm text-muted">
          Only the project owner can post in #announcements.
        </p>
      </div>
    );
  }

  const submit = () => {
    if (!value.trim()) return;
    sendMessage(projectId, channelId, { body: value, attachments: [] });
    setValue("");
  };

  return (
    <form
      className="shrink-0 px-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-2 rounded-[24px] bg-bg p-2">
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
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            channelId === "announcements" ? "Post an announcement" : "Message #general"
          }
          className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-subtle"
        />
        {value.length >= COUNT_FROM && (
          <span className="pb-2 text-xs text-subtle">
            {value.length} / {MAX_LENGTH}
          </span>
        )}
        <button
          type="submit"
          aria-label="Send message"
          disabled={!value.trim()}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </form>
  );
}
