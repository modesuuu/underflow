import { getSessionUser } from "@/features/auth/session";

export interface NavChild {
  id: string;
  label: string;
  icon: string;
  /** Open-task count, shown as a quiet trailing chip. */
  count?: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** Expandable submenu rows (Tasks lists its boards). */
  children?: NavChild[];
  /** Optional route path. When set, clicking the nav item navigates here. */
  href?: string;
  /** Cross-frame destinations (e.g. Admin) load a fresh document
   *  instead of soft-navigating between RootShell frames. */
  hard?: boolean;
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
      { id: "collaborations", label: "Collaborations", icon: "group", href: "/collaborations" },
      { id: "my-collab", label: "My Collaborations", icon: "layout", href: "/my-collaborations" },
      {
        id: "tasks",
        label: "Tasks",
        icon: "task",
        href: "/tasks",
        // Sample boards from the /tasks board's sample world;
        // this list becomes the planner API's per-collab list
        // when the wiring lands.
        children: [
          { id: "board-underflow", label: "Underflow", icon: "layout", count: 15 },
          { id: "board-lombakampus", label: "LombaKampus", icon: "trophy", count: 3 },
          { id: "board-portfolio", label: "Portfolio", icon: "briefcase", count: 1 },
        ],
      },
      { id: "circle", label: "Circle", icon: "conversation", href: "/circle" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      { id: "search", label: "Search", icon: "search", href: "/search" },
      { id: "inbox", label: "Inbox", icon: "envelope", href: "/inbox" },
    ],
  },
];

// Help Center used to live here; removed 2026-11-07 (user's plan:
// it moves to the Settings page later).
export const FOOTER_LINKS: NavItem[] = [
  { id: "settings", label: "Setting", icon: "cog", href: "/settings" },
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