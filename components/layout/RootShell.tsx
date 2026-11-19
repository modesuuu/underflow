"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { setMobileNav, useMobileNavOpen } from "./mobile-nav";
import { Sidebar } from "./Sidebar";
import { SkipLink } from "@/components/ui/SkipLink";
import { LivePoller } from "@/features/dashboard/components/LivePoller";
import { RedirectIfAuthed, RequireAuth } from "@/features/auth/components/AuthGate";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { applyThemeMode } from "@/components/ui/ThemeToggle";

/**
 * The persistent app frame, mounted once by the root layout.
 *
 * The Sidebar lives here — not inside each page's AppShell — so
 * it never unmounts on navigation: the active pill glides from
 * page to page, the rail preference is read once, and tooltip /
 * accordion state survives the trip. AppShell keeps the per-page
 * parts (TopBar, scrolling main, right panel) and renders as
 * this frame's flex child.
 *
 * Profile routes used to keep a chrome-free treatment; since
 * 2026-11-19 they ride the standard frame like every other
 * app page (user request).
 *
 * Circle routes are the one exception (user request 2026-11-19):
 * the workspace is a full-height chat layout, so the frame drops
 * the Sidebar there and the Circle rail carries a back-to-feed
 * button pinned at its bottom instead.
 */
export function RootShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const mobileOpen = useMobileNavOpen();
  // The drawer never survives a navigation.
  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);
  // Theme safety net: re-apply the saved mode once on mount. The
  // pre-paint init script normally stamps it, but if that stamp is
  // ever missed (a dev-server restart reload, a restored tab), the
  // app must still come up in the saved theme, not the default.
  useEffect(() => {
    const m = localStorage.getItem("uf-theme-mode");
    if (m === "light" || m === "dark" || m === "system") {
      applyThemeMode(m);
    }
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNav(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";
  // Public legal/info pages: no app frame, no auth gate,
  // reachable signed in or out (linked from signup).
  const isLegalRoute =
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/about" ||
    pathname === "/contact";
  // Framed routes (app + admin) own their scrolling through inner
  // containers; the document itself must never scroll, or a stray
  // window scroll leaves the whole frame shifted with a void below
  // it (the admin -> Open post report). Bare routes (auth, legal)
  // keep native document scrolling.
  const lockDocumentScroll = !isAuthRoute && !isLegalRoute;
  useEffect(() => {
    if (!lockDocumentScroll) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [lockDocumentScroll, pathname]);
  if (isAuthRoute) {
    // The reset page stays reachable while signed in: a reset link
    // can be opened in a browser with a live session, and the reset
    // itself revokes older sessions server-side.
    if (pathname === "/reset-password" || pathname === "/verify-email")
      return <>{children}</>;
    return <RedirectIfAuthed>{children}</RedirectIfAuthed>;
  }
  if (isLegalRoute) {
    return <>{children}</>;
  }
  if (pathname?.startsWith("/circle")) {
    return (
      <RequireAuth>
        <LivePoller />
        <div className="flex h-dvh w-full overflow-hidden">
          <SkipLink label={t("common.skipToContent")} />
          {children}
        </div>
      </RequireAuth>
    );
  }
  if (pathname?.startsWith("/admin")) {
    return (
      <RequireAuth>
        <LivePoller />
        {children}
      </RequireAuth>
    );
  }
  return (
    <RequireAuth>
      <LivePoller />
      <div className="flex h-dvh w-full overflow-hidden">
        <SkipLink label={t("common.skipToContent")} />
        <Sidebar />
        {mobileOpen && (
          <button
            type="button"
            aria-label={t("common.closeMenu")}
            onClick={() => setMobileNav(false)}
            className="fixed inset-0 z-40 cursor-pointer bg-black/40 lg:hidden"
          />
        )}
        {children}
      </div>
    </RequireAuth>
  );
}
