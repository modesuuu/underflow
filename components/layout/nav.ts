import { getSessionUser } from "@/features/auth/session";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** Optional route path. When set, clicking the nav item navigates here. */
  href?: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const DEFAULT_ACTIVE_ID = "feeds";

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    items: [
      { id: "feeds", label: "Feeds", icon: "grid-alt", href: "/" },
      { id: "tasks", label: "Tasks", icon: "collection" },
      { id: "collaborations", label: "Collaborations", icon: "group", href: "/collaborations" },
      { id: "circle", label: "Circle", icon: "conversation", href: "/circle" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      { id: "inbox", label: "Inbox", icon: "envelope", href: "/inbox" },
      { id: "my-collab", label: "My Collaborations", icon: "group", href: "/my-collaborations" },
    ],
  },
];

// Help Center used to live here; removed 2026-11-07 (user's plan:
// it moves to the Settings page later).
export const FOOTER_LINKS: NavItem[] = [
  { id: "settings", label: "Setting", icon: "cog" },
];

// TODO(backend): replace with GET /api/me once auth lands.
// Until then the identity is session-aware: the signed-in user's name
// and email from the auth store, falling back to the placeholder when
// logged out. Every consumer reads these getters at render time, so
// login and logout update the shell without touching the call sites.
export const CURRENT_USER = {
  get name(): string {
    return getSessionUser()?.name ?? "Username";
  },
  get email(): string {
    return getSessionUser()?.email ?? "Username@gmail.com";
  },
  get photo(): string | undefined {
    return getSessionUser()?.photo;
  },
};