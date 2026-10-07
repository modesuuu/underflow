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
      { id: "feeds", label: "Feeds", icon: "grid-alt" },
      { id: "tasks", label: "Tasks", icon: "collection" },
      { id: "collaborations", label: "Collaborations", icon: "group", href: "/collaborations" },
      { id: "circle", label: "Circle", icon: "conversation" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      { id: "inbox", label: "Inbox", icon: "envelope" },
      { id: "my-collab", label: "My collab", icon: "group" },
    ],
  },
];

export const FOOTER_LINKS: NavItem[] = [
  { id: "help-center", label: "Help Center", icon: "help-circle" },
  { id: "settings", label: "Setting", icon: "cog" },
];

// TODO(backend): replace with GET /api/me once auth lands
export const CURRENT_USER = {
  name: "Username",
  email: "Username@gmail.com",
};