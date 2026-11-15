"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession, resyncSession, restoreSession } from "../session";
import { useIsAuthenticated } from "../store";

/**
 * Client-side route guards. The session lives in localStorage (the real
 * backend returns the token in the response body and sets no cookie), so
 * Next.js middleware cannot see it — the gate runs after mount instead.
 * Before the mount check resolves, nothing renders: no flash of protected
 * content, and no protected content in the server HTML.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const authed = useIsAuthenticated();

  useEffect(() => {
    restoreSession();
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !authed) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
    }
  }, [ready, authed, pathname, router]);

  // Back-forward cache guard: a restored page revives the heap as it
  // was when frozen, so after signing out in a later document the
  // back button can resurrect a signed-in UI whose storage session is
  // already gone. Resync from storage on restore and on history
  // traversal; if the session is gone after a restore, leave with a
  // hard navigation so the stale snapshot is discarded outright.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      resyncSession();
      if (!getSession()) {
        window.location.replace(
          `/login?next=${encodeURIComponent(pathname ?? "/")}`,
        );
      }
    };
    const onPopState = () => {
      resyncSession();
    };
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname]);

  if (!ready || !authed) return null;
  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const authed = useIsAuthenticated();

  useEffect(() => {
    restoreSession();
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && authed) router.replace("/");
  }, [ready, authed, router]);

  if (!ready || authed) return null;
  return <>{children}</>;
}
