"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { setMobileNav, useMobileNavOpen } from "./mobile-nav";
import { Sidebar } from "./Sidebar";

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
 * Profile routes keep their chrome-free treatment (AppShell
 * navVariant "none" draws its own full-height shell), so the
 * frame steps aside for them.
 */
export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mobileOpen = useMobileNavOpen();
  // The drawer never survives a navigation.
  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNav(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  if (pathname?.startsWith("/profile")) {
    return <>{children}</>;
  }
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar />
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-ink/40 lg:hidden"
        />
      )}
      {children}
    </div>
  );
}
