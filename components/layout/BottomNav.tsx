"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { getInboxSummary } from "@/features/inbox/api";
import { CURRENT_USER } from "./nav";

/**
 * Mobile-style bottom navigation for the Profile section (Figma 414:822
 * draws the Profile without the app sidebar; the section keeps full
 * navigation as a bottom bar instead). In-flow chrome — AppShell renders
 * it below the content row, so it never overlays page content.
 *
 * Items mirror the Sidebar's routed entries (Feeds, Collaborations,
 * Inbox, My Collaborations) plus the user's own profile. My Collab uses
 * "collection" here — the Sidebar can reuse "group" for both collab
 * entries because they sit in different sections; in one bar the two
 * identical glyphs would collide. Inbox has no route yet, same as in
 * the Sidebar, and carries the unread badge.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getInboxSummary()
      .then((summary) => {
        if (!cancelled) setInboxUnread(summary.unreadCount);
      })
      .catch(() => {
        /* badge is decorative; navigation works without it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = (href?: string, exact = false) => {
    if (!href || !pathname) return false;
    return exact ? pathname === href : pathname.startsWith(href);
  };

  const itemClass = (active: boolean) =>
    clsx(
      "flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-transform duration-150 ease-out active:scale-95",
      "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    );
  const pillClass = (active: boolean) =>
    clsx(
      "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 ease-out",
      active ? "bg-accent text-ink" : "text-muted"
    );
  const labelClass = (active: boolean) =>
    clsx(
      "text-[10px] leading-none font-medium",
      active ? "text-ink" : "text-muted"
    );

  const profileActive = isActive("/profile");

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-line bg-surface"
    >
      <div className="mx-auto flex w-full max-w-2xl items-stretch justify-between px-2">
        <Link
          href="/"
          className={itemClass(isActive("/", true))}
          aria-current={isActive("/", true) ? "page" : undefined}
        >
          <span className={pillClass(isActive("/", true))}>
            <Icon name="grid-alt" size={20} />
          </span>
          <span className={labelClass(isActive("/", true))}>Feeds</span>
        </Link>

        <Link
          href="/collaborations"
          className={itemClass(isActive("/collaborations"))}
          aria-current={isActive("/collaborations") ? "page" : undefined}
        >
          <span className={pillClass(isActive("/collaborations"))}>
            <Icon name="group" size={20} />
          </span>
          <span className={labelClass(isActive("/collaborations"))}>
            Collaborations
          </span>
        </Link>

        <button type="button" className={itemClass(false)} aria-label="Inbox">
          <span className={pillClass(false)}>
            <Icon name="envelope" size={20} />
            {inboxUnread > 0 && (
              <Badge
                count={inboxUnread}
                tone="danger"
                className="absolute -top-1.5 -right-2"
              />
            )}
          </span>
          <span className={labelClass(false)}>Inbox</span>
        </button>

        <Link
          href="/my-collaborations"
          className={itemClass(isActive("/my-collaborations"))}
          aria-current={isActive("/my-collaborations") ? "page" : undefined}
        >
          <span className={pillClass(isActive("/my-collaborations"))}>
            <Icon name="collection" size={20} />
          </span>
          <span className={labelClass(isActive("/my-collaborations"))}>
            My Collab
          </span>
        </Link>

        <Link
          href="/profile/me"
          className={itemClass(profileActive)}
          aria-current={profileActive ? "page" : undefined}
          aria-label="Your profile"
        >
          <span className={pillClass(profileActive)}>
            <Avatar size={20} alt={CURRENT_USER.name} />
          </span>
          <span className={labelClass(profileActive)}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
