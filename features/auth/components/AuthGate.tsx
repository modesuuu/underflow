"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { restoreSession, useIsAuthenticated } from "../store";

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
