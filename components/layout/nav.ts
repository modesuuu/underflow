export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** Optional route path. When set, clicking the nav item navigates here. */
  href?: string;
  /** Short label shown under the icon on the collapsed rail. */
  railLabel?: string;
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
      { id: "collaborations", label: "Collaborations", icon: "group", href: "/collaborations", railLabel: "Collabs" },
      { id: "circle", label: "Circle", icon: "conversation" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      { id: "inbox", label: "Inbox", icon: "envelope", href: "/inbox" },
      { id: "my-collab", label: "My Collaborations", icon: "group", href: "/my-collaborations", railLabel: "My Collabs" },
    ],
  },
];

export const FOOTER_LINKS: NavItem[] = [
  { id: "help-center", label: "Help Center", icon: "help-circle", railLabel: "Help" },
  { id: "settings", label: "Setting", icon: "cog" },
];

// TODO(backend): replace with GET /api/me once auth lands
export const CURRENT_USER = {
  name: "Username",
  email: "Username@gmail.com",
};