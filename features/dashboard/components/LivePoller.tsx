"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useIsAuthenticated } from "@/features/auth/store";
import { getSession, getSessionUser, setSession } from "@/features/auth/session";
import {
  apiFetch,
  refreshSessionToken,
  type ApiEnvelope,
} from "@/lib/api-client";
import { getDashboardPosts } from "../api";
import { syncLikeCount } from "../like-store";
import { setCommentCount } from "../comment-count-store";
import {
  getNotifications,
  mapWireNotification,
  type BackendNotification,
} from "../notifications-api";
import {
  addNotification,
  removeNotification,
  setNotifications,
} from "../notifications-store";
import {
  applyRealtimeInboxMessage,
  applyRealtimeInboxUpdate,
  refreshConversations,
} from "@/features/inbox/store";
import {
  applyRealtimeZoneMessage,
  applyRealtimeZoneMessageDeleted,
  applyRealtimeZoneMessageUpdated,
} from "@/features/circle/store";
import { refreshCircles, updateCircle } from "@/features/circle/circles";
import { applyRealtimePlannerTask } from "@/features/planner/store";
import type { PlannerTask } from "@/features/planner/types";
import {
  applyThemeMode,
  type ThemeMode,
} from "@/components/ui/ThemeToggle";
import type { ZoneMessage } from "@/features/circle/types";
import type { BackendInboxMessage } from "@/features/inbox/api";

/**
 * LivePoller — realtime delivery for notifications + like/comment counts.
 *
 * PRIMARY: a WebSocket to the underflow-realtime server
 * (NEXT_PUBLIC_REALTIME_URL, default ws://127.0.0.1:8080). The client
 * authenticates with its JWT as the first message, then the server pushes:
 *  - "notification" -> the new notification is prepended to the store
 *  - "notification-removed" -> that notification disappears
 *  - "post-stats" -> the post's like/comment counts update in place
 *  - "comment-stats" -> a comment's like count updates in place
 * Reconnects with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s).
 *
 * FALLBACK: while the socket is not connected (failed / reconnecting),
 * the 5s polling loop runs (getNotifications + getDashboardPosts on
 * feed-ish pages), so nothing is ever lost if the WS server is down.
 * When the socket reconnects, polling stops and one fresh fetch runs
 * to catch anything that arrived during the gap.
 *
 * Pauses everything while the tab is hidden; fetches + reconnects
 * immediately when it becomes visible again. Renders nothing; mounted
 * once in RootShell so it keeps running across navigations. All
 * fetches / socket errors are best-effort — nothing here can crash
 * the page.
 */

/** Poll cadence while the socket is down (5s). */
const POLL_MS = 5000;
/** Reconnect backoff steps (ms), capped at the last value. */
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000];
/** WS endpoint (override per environment via .env.local). */
const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://127.0.0.1:8080";

export function LivePoller() {
  const isAuthed = useIsAuthenticated();
  const pathname = usePathname();
  // The socket must survive navigation, so the effect does not depend
  // on pathname — the current path is read through a ref instead.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const isAuthedRef = useRef(isAuthed);
  isAuthedRef.current = isAuthed;

  // One-time backfill: sessions saved before AuthUser gained `photo`
  // have no avatar. When logged in and the photo is missing, fetch
  // the profile once and store the photo in the session so the
  // comment avatars (and anything else reading CURRENT_USER.photo)
  // show it. Best-effort — a failure never crashes the page, and
  // the next login retries (the guard resets on logout).
  const photoRefreshDone = useRef(false);
  useEffect(() => {
    if (!isAuthed) {
      photoRefreshDone.current = false;
      return;
    }
    if (photoRefreshDone.current) return;
    if (getSessionUser()?.photo) {
      photoRefreshDone.current = true;
      return;
    }
    photoRefreshDone.current = true;
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<{ photo_profile_url?: string | null }>>("/api/profiles/me");
        const url = res.data?.photo_profile_url;
        const sess = getSession();
        if (!url || !sess) return;
        setSession({ ...sess, user: { ...sess.user, photo: url } });
      } catch {
        // Best-effort: the avatar keeps its initials fallback.
      }
    })();
  }, [isAuthed]);

  // Display-name backfill: sessions saved before display names
  // were wired carry the username as their name. While the session
  // name still equals the username, pick the editable profile
  // full_name up from /api/profiles/me once per mount — the same
  // source the photo and role backfills use. New logins get the
  // name straight from the login response.
  const nameRefreshDone = useRef(false);
  useEffect(() => {
    if (!isAuthed || nameRefreshDone.current) return;
    const current = getSessionUser();
    if (!current || current.name !== current.username) {
      nameRefreshDone.current = true;
      return;
    }
    nameRefreshDone.current = true;
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<{ full_name?: string | null }>>("/api/profiles/me");
        const fullName = res.data?.full_name?.trim();
        const sess = getSession();
        if (!fullName || !sess) return;
        setSession({ ...sess, user: { ...sess.user, name: fullName } });
      } catch {
        // Best-effort: the username keeps showing as the name.
      }
    })();
  }, [isAuthed]);

  // Email-verification backfill: sessions saved before verification
  // existed learn the flag from /api/profiles/me so the reminder
  // banner shows (or stays hidden) correctly. One shot per mount,
  // and only while the flag is still unknown.
  const verifyRefreshDone = useRef(false);
  useEffect(() => {
    if (!isAuthed || verifyRefreshDone.current) return;
    if (getSessionUser()?.emailVerified !== undefined) {
      verifyRefreshDone.current = true;
      return;
    }
    verifyRefreshDone.current = true;
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<{ email_verified?: boolean }>>("/api/profiles/me");
        const sess = getSession();
        if (!sess || typeof res.data?.email_verified !== "boolean") return;
        setSession({ ...sess, user: { ...sess.user, emailVerified: res.data.email_verified } });
      } catch {
        // Best-effort: the banner simply stays hidden this session.
      }
    })();
  }, [isAuthed]);

  // Token refresh (audit P0, 2026-11-14): when the session token
  // is in its last day, swap it for a fresh one. The rotation
  // itself lives in lib/api-client (refreshSessionToken) because
  // it must be single-flight: this poller used to rotate on its
  // own while other requests were still carrying the old token,
  // and a remount could rotate a second time — the revoked-token
  // 401 wave fixed 2026-11-16. One shot per mount, best-effort.
  const tokenRefreshDone = useRef(false);
  useEffect(() => {
    if (!isAuthed || tokenRefreshDone.current) return;
    tokenRefreshDone.current = true;
    void refreshSessionToken();
  }, [isAuthed]);

  // Role backfill: sessions saved before roles existed pick the
  // role up from /api/profiles/me so the sidebar can show the
  // Admin entry (spec-admin.md §2). One shot per mount.
  const roleRefreshDone = useRef(false);
  useEffect(() => {
    if (!isAuthed || roleRefreshDone.current) return;
    if (getSessionUser()?.role) {
      roleRefreshDone.current = true;
      return;
    }
    roleRefreshDone.current = true;
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<{ role?: string | null }>>(
          "/api/profiles/me"
        );
        const role = res.data?.role;
        const sess = getSession();
        if (!role || !sess) return;
        setSession({
          ...sess,
          user: {
            ...sess.user,
            role: role as "user" | "monitor" | "super_admin",
          },
        });
      } catch {
        // Best-effort: no Admin entry until the next login.
      }
    })();
  }, [isAuthed]);

  // Theme sync (2026-11-18): the account carries the theme mode so
  // it follows the user across origins, browsers, and devices
  // (localStorage alone is per-origin and looked like the choice
  // was never saved). Account value wins when present; a local-only
  // choice is pushed up once. One shot per mount, best-effort.
  const themeSyncDone = useRef(false);
  useEffect(() => {
    if (!isAuthed || themeSyncDone.current) return;
    let cancelled = false;
    (async () => {
      // Retry while the backend is unreachable (e.g. the page
      // loaded during a server restart): one failed attempt must
      // not leave the account theme unapplied for the whole
      // session. Success marks it done; the local theme keeps
      // working in the meantime.
      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
        }
        try {
          const res = await apiFetch<ApiEnvelope<{ theme_mode?: string | null }>>(
            "/api/profiles/me"
          );
          const accountMode = res.data?.theme_mode;
          const local = localStorage.getItem("uf-theme-mode");
          const isMode = (v: string | null | undefined): v is ThemeMode =>
            v === "light" || v === "dark" || v === "system";
          if (isMode(accountMode)) {
            if (local !== accountMode) {
              localStorage.setItem("uf-theme-mode", accountMode);
              applyThemeMode(accountMode);
            }
          } else if (isMode(local)) {
            await apiFetch("/api/profiles/me", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ theme_mode: local }),
            });
          }
          themeSyncDone.current = true;
          return;
        } catch {
          // Backend not answering yet: back off and retry.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);
  useEffect(() => {
    if (!isAuthed) return;
    let stopped = false;
    let ws: WebSocket | null = null;
    let authed = false;
    let backoffIdx = 0;
    let reconnectTimer: number | null = null;
    let pollTimer: number | null = null;

    const isFeedPage = () => {
      const p = pathnameRef.current;
      return p === "/" || p?.startsWith("/dashboard");
    };

    const fetchNotifications = async () => {
      try {
        const items = await getNotifications();
        if (!stopped) setNotifications(items);
      } catch {
        // Best-effort: the next tick retries.
      }
    };
    const fetchPostStats = async () => {
      if (!isFeedPage()) return; // only where the counts are visible
      try {
        const posts = await getDashboardPosts();
        if (stopped) return;
        for (const post of posts) {
          syncLikeCount(post.id, post.likes);
          setCommentCount(post.id, post.commentCount);
        }
      } catch {
        // Best-effort: the next tick retries.
      }
    };
    const fetchAll = () => {
      void fetchNotifications();
      void fetchPostStats();
      void refreshConversations();
      // Circle nav badge: re-fetch the list so its unread totals
      // stay correct even if a realtime bump was missed (socket
      // was down, tab was hidden, or the push arrived before the
      // list loaded). Only runs while polling, i.e. while WS is down.
      void refreshCircles();
    };

    const wsLive = () =>
      authed && ws !== null && ws.readyState === WebSocket.OPEN;

    const startPolling = () => {
      if (pollTimer !== null || document.hidden) return;
      pollTimer = window.setInterval(() => {
        if (stopped || document.hidden) return;
        if (wsLive()) return; // WS is live: polling stays quiet
        fetchAll();
      }, POLL_MS);
    };
    const stopPolling = () => {
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (stopped || document.hidden) return;
      const delay = BACKOFF_MS[Math.min(backoffIdx, BACKOFF_MS.length - 1)];
      backoffIdx += 1;
      reconnectTimer = window.setTimeout(() => {
        if (!stopped) connect();
      }, delay);
    };

    const connect = () => {
      if (stopped || !isAuthedRef.current || document.hidden) return;
      const token = getSession()?.token;
      if (!token) {
        // No session token yet (e.g. still restoring) — retry with backoff.
        scheduleReconnect();
        return;
      }
      let socket: WebSocket;
      try {
        socket = new WebSocket(WS_URL);
      } catch {
        scheduleReconnect();
        return;
      }
      ws = socket;

      socket.onopen = () => {
        // Authenticate first; the server only routes after auth.
        try {
          socket.send(JSON.stringify({ type: "auth", token }));
        } catch {
          // send failed: close will follow and trigger reconnect.
        }
      };

      socket.onmessage = (event) => {
        let msg: { type?: string; payload?: Record<string, unknown> };
        try {
          msg = JSON.parse(typeof event.data === "string" ? event.data : "");
        } catch {
          return; // ignore non-JSON
        }
        if (!msg || typeof msg.type !== "string") return;

        if (msg.type === "authed") {
          // WS is live: stop polling, one fresh fetch to catch the gap.
          authed = true;
          backoffIdx = 0;
          stopPolling();
          fetchAll();
          return;
        }
        if (msg.type === "notification") {
          const raw = (msg.payload as { notification?: unknown } | undefined)
            ?.notification;
          if (raw) {
            try {
              addNotification(mapWireNotification(raw as BackendNotification));
            } catch {
              // A malformed push never breaks the page; the next poll fixes it.
            }
          }
          return;
        }
        if (msg.type === "notification-removed") {
          const id = (msg.payload as { notificationId?: unknown } | undefined)
            ?.notificationId;
          if (typeof id === "string") removeNotification(id);
          return;
        }
        if (msg.type === "post-stats") {
          const p = (msg.payload ?? {}) as {
            postId?: unknown;
            likes?: unknown;
            commentCount?: unknown;
          };
          if (typeof p.postId === "string") {
            if (typeof p.likes === "number")
              syncLikeCount(p.postId, p.likes);
            if (typeof p.commentCount === "number")
              setCommentCount(p.postId, p.commentCount);
          }
          return;
        }
        if (msg.type === "inbox-message") {
          const conversationId = msg.payload?.conversationId;
          const message = msg.payload?.message;
          if (typeof conversationId === "string" && message) {
            applyRealtimeInboxMessage(
              conversationId,
              message as unknown as BackendInboxMessage,
            );
          }
          return;
        }
        if (msg.type === "inbox-update") {
          const conversationId = msg.payload?.conversationId;
          if (typeof conversationId === "string") {
            applyRealtimeInboxUpdate(conversationId);
          }
          return;
        }
        if (msg.type === "zone-message") {
          const circleId = msg.payload?.circleId;
          const zoneId = msg.payload?.zoneId;
          const message = msg.payload?.message;
          if (
            typeof circleId === "string" &&
            typeof zoneId === "string" &&
            message
          ) {
            applyRealtimeZoneMessage({
              circleId,
              zoneId,
              message: message as unknown as ZoneMessage,
            });
            // Live Circle sidebar badge: bump the list's unreadCount
            // so the nav badge updates on every page, not only while
            // the Circle page is open. CircleWorkspace owns the bump
            // while on /circle (it also skips the zone being viewed),
            // so this branch stays out of its way there. Own
            // messages never count as unread.
            const authorId = (message as { authorId?: unknown }).authorId;
            const myId = getSessionUser()?.id;
            const onCirclePage = (pathnameRef.current ?? "").startsWith(
              "/circle",
            );
            if (
              typeof authorId === "string" &&
              authorId !== myId &&
              !onCirclePage
            ) {
              updateCircle(circleId, (c) => ({
                ...c,
                unreadCount: c.unreadCount + 1,
              }));
            }
          }
          return;
        }
        if (msg.type === "zone-message-updated") {
          const circleId = msg.payload?.circleId;
          const zoneId = msg.payload?.zoneId;
          const message = msg.payload?.message;
          if (
            typeof circleId === "string" &&
            typeof zoneId === "string" &&
            message
          ) {
            applyRealtimeZoneMessageUpdated({
              circleId,
              zoneId,
              message: message as unknown as ZoneMessage,
            });
          }
          return;
        }
        if (msg.type === "zone-message-deleted") {
          const circleId = msg.payload?.circleId;
          const zoneId = msg.payload?.zoneId;
          const messageId = msg.payload?.messageId;
          if (
            typeof circleId === "string" &&
            typeof zoneId === "string" &&
            typeof messageId === "string"
          ) {
            applyRealtimeZoneMessageDeleted({ circleId, zoneId, messageId });
          }
          return;
        }
        if (msg.type === "planner-task") {
          const collabId = msg.payload?.collabId;
          const task = msg.payload?.task;
          if (typeof collabId === "string" && task) {
            applyRealtimePlannerTask({
              collabId,
              task: task as unknown as PlannerTask,
            });
          }
          return;
        }
        if (msg.type === "comment-stats") {
          const p = (msg.payload ?? {}) as {
            commentId?: unknown;
            likes?: unknown;
          };
          // Comment likes share the like-store under the
          // "comment:<id>" key (see LikeButton); syncLikeCount only
          // overwrites the count and preserves the local `liked`.
          if (typeof p.commentId === "string" && typeof p.likes === "number")
            syncLikeCount("comment:" + p.commentId, p.likes);
          return;
        }
      };

      const onDown = () => {
        authed = false;
        if (ws === socket) ws = null;
        // WS down: polling covers delivery until we reconnect.
        startPolling();
        scheduleReconnect();
      };
      socket.onclose = onDown;
      socket.onerror = () => {
        // onclose follows; handled there.
      };
    };

    // Start: immediate fetch + polling until the socket is live.
    fetchAll();
    startPolling();
    connect();

    const onVisible = () => {
      if (document.hidden) {
        // Pause everything while hidden.
        stopPolling();
        if (reconnectTimer !== null) {
          window.clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        if (ws) {
          try {
            ws.close();
          } catch {}
          ws = null;
        }
        authed = false;
        return;
      }
      // Back to visible: fresh fetch + reconnect immediately.
      fetchAll();
      if (!wsLive()) connect();
      startPolling();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      stopPolling();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisible);
      if (ws) {
        try {
          ws.close();
        } catch {}
        ws = null;
      }
    };
  }, [isAuthed]);

  return null;
}
