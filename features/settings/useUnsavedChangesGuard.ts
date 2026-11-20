"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PendingNav =
  | { kind: "back" }
  | { kind: "link"; href: string }
  | null;

/**
 * Guards a dirty form against losing edits:
 * - tab close / refresh: the native beforeunload prompt
 * - browser Back: a sentinel history entry traps the pop, and the
 *   caller shows a confirm modal instead of leaving
 * - in-app anchor clicks: intercepted in the capture phase before
 *   Next's router sees them
 * confirmLeave() performs the pending navigation; cancelLeave()
 * just closes the modal (the sentinel stays armed for Back).
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const router = useRouter();
  const [pendingNav, setPendingNav] = useState<PendingNav>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const bypassRef = useRef(false);
  const sentinelRef = useRef(false);

  // Arm the Back-button sentinel while there are unsaved edits.
  useEffect(() => {
    if (dirty && !sentinelRef.current) {
      window.history.pushState({ ufUnsavedGuard: true }, "");
      sentinelRef.current = true;
    }
  }, [dirty]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onPopState = () => {
      if (bypassRef.current) {
        bypassRef.current = false;
        sentinelRef.current = false;
        return;
      }
      if (!dirtyRef.current) {
        sentinelRef.current = false;
        return;
      }
      // Back pressed with unsaved edits: re-arm and ask first.
      window.history.pushState({ ufUnsavedGuard: true }, "");
      sentinelRef.current = true;
      setPendingNav({ kind: "back" });
    };
    const onClick = (event: MouseEvent) => {
      if (!dirtyRef.current || bypassRef.current) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || anchor.target === "_blank") {
        return;
      }
      if (href === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNav({ kind: "link", href });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const confirmLeave = () => {
    const nav = pendingNav;
    setPendingNav(null);
    if (!nav) return;
    bypassRef.current = true;
    if (nav.kind === "link") {
      router.push(nav.href);
    } else {
      // Stack: [..., previous page, this page, sentinel]. The modal
      // re-armed the sentinel after the trapped pop, so leaving for
      // real takes two steps back.
      window.history.go(-2);
    }
  };

  const cancelLeave = () => setPendingNav(null);

  /** After a successful save, drop the sentinel so the next Back
   *  press leaves normally instead of eating a dead step. */
  const disarmAfterSave = () => {
    if (sentinelRef.current) {
      bypassRef.current = true;
      sentinelRef.current = false;
      window.history.back();
    }
  };

  return { pendingNav, confirmLeave, cancelLeave, disarmAfterSave };
}
