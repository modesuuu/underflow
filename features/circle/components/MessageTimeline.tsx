"use client";

import { useLayoutEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { MessageItem } from "./MessageItem";
import type { CircleZone, ZoneMessage } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/** Local calendar-day key for grouping ("2026-11-18"). */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isContinuation(prev: ZoneMessage, next: ZoneMessage): boolean {
  if (prev.authorId !== next.authorId) return false;
  if (dayKey(prev.createdAt) !== dayKey(next.createdAt)) return false;
  const gap = new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return gap >= 0 && gap < 5 * 60 * 1000;
}

/**
 * The scrolling message list for one zone (Circle Phase 2): day
 * dividers, author grouping, a load-older button while the backend
 * says more history exists, and the welcome empty state while the
 * zone has no messages at all.
 *
 * Scroll behaviour: the first load lands at the bottom; new messages
 * keep the view pinned only when the reader is already near the
 * bottom; loading older messages preserves the reading position.
 */
export function MessageTimeline({
  messages,
  memberNames,
  zone,
  hasMore,
  loadingOlder,
  onLoadOlder,
}: {
  messages: ZoneMessage[];
  memberNames: string[];
  zone: CircleZone;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
}) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<{ count: number; firstId: string | null; height: number; top: number }>({
    count: 0,
    firstId: null,
    height: 0,
    top: 0,
  });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevRef.current;
    const firstId = messages[0]?.id ?? null;
    if (prev.count === 0 && messages.length > 0) {
      // First load: land at the newest message.
      el.scrollTop = el.scrollHeight;
    } else if (firstId !== prev.firstId && messages.length > prev.count) {
      // Older page prepended: keep the same messages in view.
      el.scrollTop = prev.top + (el.scrollHeight - prev.height);
    } else if (messages.length > prev.count) {
      // Appended: follow only when the reader was near the bottom.
      const nearBottom = prev.height - prev.top - el.clientHeight < 160;
      if (nearBottom) el.scrollTop = el.scrollHeight;
    }
    prevRef.current = {
      count: messages.length,
      firstId,
      height: el.scrollHeight,
      top: el.scrollTop,
    };
  }, [messages]);

  const dayLabel = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (dayKey(iso) === dayKey(now.toISOString())) return t("circle.today");
    if (dayKey(iso) === dayKey(yesterday.toISOString())) return t("circle.yesterday");
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-bg text-subtle">
          <Icon name="conversation" size={22} />
        </span>
        <p className="text-base font-medium text-ink">
          {t("circle.zoneEmptyTitle", { zone: zone.title })}
        </p>
        <p className="max-w-sm text-sm text-muted">
          {zone.title === "announcements"
            ? t("circle.zoneEmptyAnnouncements")
            : t("circle.zoneEmptyGeneral")}
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-4">
      {hasMore && (
        <div className="flex justify-center pb-3">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="cursor-pointer rounded-full bg-bg px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-line/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("circle.loadOlderMessages")}
          </button>
        </div>
      )}
      {messages.map((message, i) => {
        const prev = i > 0 ? messages[i - 1] : null;
        const newDay = !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
        return (
          <div key={message.id}>
            {newDay && (
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs font-medium text-subtle">
                  {dayLabel(message.createdAt)}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <MessageItem
              message={message}
              memberNames={memberNames}
              isContinuation={!!prev && !newDay && isContinuation(prev, message)}
              groupStart={!!prev && !newDay && !isContinuation(prev, message)}
            />
          </div>
        );
      })}
    </div>
  );
}
