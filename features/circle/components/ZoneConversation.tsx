"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getZoneMessages, sendZoneMessage } from "../api";
import { subscribeZoneMessages } from "../store";
import { Composer } from "./Composer";
import { MessageTimeline } from "./MessageTimeline";
import type { CircleDetail, CircleZone, ZoneMessage } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useSessionUser } from "@/features/auth/store";

const PAGE_SIZE = 50;
/** Fallback refresh cadence (the LivePoller pattern: WS first). */
const POLL_MS = 5000;

/**
 * Merge incoming messages into the current list by id, keeping the
 * backend's chronological order (createdAt, then id — the same
 * ordering the pagination cursor uses). Returns the current array
 * untouched when nothing is new, so renders stay cheap.
 */
function mergeMessages(
  current: ZoneMessage[],
  incoming: ZoneMessage[]
): ZoneMessage[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((m) => [m.id, m]));
  let changed = false;
  for (const m of incoming) {
    if (!byId.has(m.id)) {
      byId.set(m.id, m);
      changed = true;
    }
  }
  if (!changed) return current;
  return [...byId.values()].sort((a, b) =>
    a.createdAt === b.createdAt
      ? a.id < b.id
        ? -1
        : 1
      : a.createdAt < b.createdAt
        ? -1
        : 1
  );
}

/**
 * One zone's conversation (Circle Phase 2): history from the API,
 * live appends from the realtime socket (forwarded by LivePoller
 * through the circle store), a 5-second polling fallback while the
 * socket is down, and the composer. Mounted with key={zone.id} by
 * the shell, so switching zones remounts a fresh conversation.
 */
export function ZoneConversation({
  detail,
  zone,
  onSeenNewest,
}: {
  detail: CircleDetail;
  zone: CircleZone;
  onSeenNewest?: (newestCreatedAt: string) => void;
}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ZoneMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ZoneMessage | null>(null);
  const sessionUser = useSessionUser();
  const myId = sessionUser?.id ?? null;
  // Read-state snapshot, frozen when this zone view opens. The
  // workspace marks the zone read as soon as messages render, which
  // advances the live zone values; the NEW divider must keep
  // pointing at the boundary as it was on entry (Discord behaviour),
  // so it is computed from this frozen copy, never the live props.
  const [readSnapshot] = useState(() => ({
    lastRead: zone.lastRead,
    unreadCount: zone.unreadCount,
  }));
  const firstUnreadId = useMemo(() => {
    if (readSnapshot.unreadCount <= 0 || !myId) return null;
    const since = readSnapshot.lastRead;
    const hit = messages.find(
      (m) => m.authorId !== myId && (since === null || m.createdAt > since)
    );
    return hit?.id ?? null;
  }, [messages, readSnapshot, myId]);
  const circleId = detail.id;
  const zoneId = zone.id;
  const memberNames = detail.members.map((m) => m.name);
  const stateRef = useRef({ messages, hasMore });
  stateRef.current = { messages, hasMore };

  const loadInitial = useCallback(async () => {
    setPhase("loading");
    try {
      const page = await getZoneMessages(circleId, zoneId, { limit: PAGE_SIZE });
      setMessages(page.messages);
      setHasMore(page.hasMore);
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }, [circleId, zoneId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  // Mark-as-read hook: whenever the newest message on screen changes,
  // the workspace clears this zone's unread counters (Discord-style).
  const seenRef = useRef<string | null>(null);
  useEffect(() => {
    const newest = messages[messages.length - 1];
    if (!newest || seenRef.current === newest.id) return;
    seenRef.current = newest.id;
    onSeenNewest?.(newest.createdAt);
  }, [messages, onSeenNewest]);

  // Live pushes for this zone.
  useEffect(() => {
    return subscribeZoneMessages((event) => {
      if (event.circleId !== circleId || event.zoneId !== zoneId) return;
      setMessages((current) => mergeMessages(current, [event.message]));
    });
  }, [circleId, zoneId]);

  // Polling fallback: merge the newest page every few seconds.
  // LivePoller's socket makes this redundant while it is up, and
  // merging by id makes the overlap harmless.
  useEffect(() => {
    if (phase !== "ready") return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void (async () => {
        try {
          const page = await getZoneMessages(circleId, zoneId, { limit: PAGE_SIZE });
          setMessages((current) => {
            const merged = mergeMessages(current, page.messages);
            // The poll page reaches the top of the loaded history:
            // its hasMore is the truth. Deeper (paginated) history
            // keeps the flag the last load-older call established.
            if (merged[0] && page.messages[0] && merged[0].id === page.messages[0].id) {
              setHasMore(page.hasMore);
            }
            return merged;
          });
        } catch {
          // Best-effort: the next tick retries.
        }
      })();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [circleId, zoneId, phase]);

  const loadOlder = async () => {
    const oldest = stateRef.current.messages[0];
    if (!oldest || loadingOlder || !stateRef.current.hasMore) return;
    setLoadingOlder(true);
    try {
      const page = await getZoneMessages(circleId, zoneId, {
        limit: PAGE_SIZE,
        before: oldest,
      });
      setMessages((current) => mergeMessages(current, page.messages));
      setHasMore(page.hasMore);
    } catch {
      // Keep the current list; the button stays available to retry.
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async (content: string, replyToId?: string | null) => {
    const saved = await sendZoneMessage(
      circleId,
      zoneId,
      content,
      replyToId ?? undefined
    );
    setMessages((current) => mergeMessages(current, [saved]));
    setReplyingTo(null);
  };

  if (phase === "loading") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <p className="text-sm text-subtle">{t("circle.loadingMessages")}</p>
        </div>
        <Composer zone={zone} onSend={handleSend} />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="max-w-sm text-sm text-muted">
            {t("circle.messagesLoadError")}
          </p>
          <button
            type="button"
            onClick={() => void loadInitial()}
            className="cursor-pointer rounded-full bg-bg px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-line/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {t("circle.tryAgain")}
          </button>
        </div>
        <Composer zone={zone} onSend={handleSend} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageTimeline
        messages={messages}
        memberNames={memberNames}
        zone={zone}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={() => void loadOlder()}
        onReply={
          zone.memberCanPost ? (m) => setReplyingTo(m) : undefined
        }
        firstUnreadId={firstUnreadId}
        unreadCount={readSnapshot.unreadCount}
      />
      <Composer
        zone={zone}
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
