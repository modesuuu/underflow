// features/my-collaborations/mock.ts
import { makeSlots, COLLAB_PROJECTS } from "@/features/collaborations/mock";
import type { MyCollabProject } from "./types";

// Reuse the shared member/skill pool so slot invariants stay identical to
// the public board (open slots are constructed, never dropped — audit P0-1).
const byId = (id: string) => {
  const p = COLLAB_PROJECTS.find((c) => c.id === id);
  if (!p) throw new Error(`unknown collab id in my-collab mock: ${id}`);
  return p;
};

/**
 * 12 entries — distribution not-started 4 / pending 3 / complete 3 / revise 2.
 * Titles reuse the public board where the frame shows the same project
 * ("Landing Page E-com", "Need Frontend…", SME Cashier App = frame-3 detail).
 */
export const MY_COLLAB_PROJECTS: MyCollabProject[] = [
  // ── not-started ──────────────────────────────────────────────
  {
    ...byId("collab-1"),
    myStatus: "not-started",
    subtitle: "Need Frontend...",
  },
  {
    ...byId("collab-2"),
    myStatus: "not-started",
  },
  {
    ...byId("collab-4"),
    myStatus: "not-started",
  },
  {
    ...byId("collab-6"),
    myStatus: "not-started",
  },
  // ── pending ──────────────────────────────────────────────────
  {
    ...byId("collab-5"),
    myStatus: "pending",
  },
  {
    id: "my-collab-7",
    title: "Design System Revamp",
    subtitle: "Need Designers...",
    status: "in-progress",
    type: "product",
    dueDate: "2026-11-20",
    postedAt: "2026-10-01T00:00:00Z",
    postedAgo: "6d ago",
    slotsFilled: 3,
    slotsTotal: 4,
    members: makeSlots(3, 4),
    skills: byId("collab-5").skills.slice(0, 5),
    description:
      "Refreshing a small design system: tokens, components, and docs. Application is in review.",
    workItems: ["Audit existing tokens", "Rebuild core components", "Write usage docs"],
    photos: ["photo-1", "photo-2"],
    owner: byId("collab-5").owner,
    myStatus: "pending",
  },
  {
    id: "my-collab-8",
    title: "Hackathon Starter Kit",
    subtitle: "Need Builders...",
    status: "open",
    type: "coursework",
    dueDate: "2026-12-01",
    postedAt: "2026-09-28T00:00:00Z",
    postedAgo: "1w ago",
    slotsFilled: 2,
    slotsTotal: 3,
    members: makeSlots(2, 3),
    skills: byId("collab-4").skills.slice(0, 4),
    description:
      "A boilerplate repo for campus hackathons: auth, DB, and a UI shell. Waiting for the owner to approve.",
    workItems: ["Auth flow", "DB schema", "UI shell"],
    photos: ["photo-1"],
    owner: byId("collab-4").owner,
    myStatus: "pending",
  },
  // ── complete ─────────────────────────────────────────────────
  {
    ...byId("collab-3"),
    myStatus: "complete",
  },
  {
    id: "my-collab-10",
    title: "Devlog Generator",
    subtitle: "Need Writers...",
    status: "completed",
    type: "portfolio",
    dueDate: "2026-08-15",
    postedAt: "2026-07-02T00:00:00Z",
    postedAgo: "3mo ago",
    slotsFilled: 2,
    slotsTotal: 2,
    members: makeSlots(2, 2),
    skills: byId("collab-6").skills,
    description:
      "Turns git history into readable devlogs. Shipped and wrapped up.",
    workItems: ["Commit grouping", "Markdown export"],
    photos: ["photo-1", "photo-2", "photo-3"],
    owner: byId("collab-6").owner,
    myStatus: "complete",
  },
  {
    id: "my-collab-11",
    title: "QR Menu Maker",
    subtitle: "Need Mobile...",
    status: "completed",
    type: "product",
    dueDate: "2026-09-30",
    postedAt: "2026-08-11T00:00:00Z",
    postedAgo: "2mo ago",
    slotsFilled: 3,
    slotsTotal: 3,
    members: makeSlots(3, 3),
    skills: byId("collab-5").skills.slice(2, 7),
    description:
      "Scan-to-menu for small cafés. Finished and wrapped up.",
    workItems: ["QR generation", "Menu editor", "Print template"],
    photos: ["photo-1", "photo-2", "photo-3", "photo-4"],
    owner: byId("collab-5").owner,
    myStatus: "complete",
  },
  // ── revise ───────────────────────────────────────────────────
  {
    id: "my-collab-12",
    title: "Landing Page E-com v2",
    subtitle: "Need Frontend...",
    status: "in-progress",
    type: "coursework",
    dueDate: "2026-12-25",
    postedAt: "2026-10-02T00:00:00Z",
    postedAgo: "5d ago",
    slotsFilled: 2,
    slotsTotal: 4,
    members: makeSlots(2, 4),
    skills: byId("collab-2").skills,
    description:
      "The hero section needs another pass after the last review round.",
    workItems: ["Rework hero spacing", "Re-check responsive grid"],
    photos: byId("collab-2").photos,
    owner: byId("collab-2").owner,
    myStatus: "revise",
  },
  {
    id: "my-collab-13",
    title: "Library Migration Notes",
    subtitle: "Need Writers...",
    status: "in-progress",
    type: "portfolio",
    dueDate: "2027-01-30",
    postedAt: "2026-09-29T00:00:00Z",
    postedAgo: "4d ago",
    slotsFilled: 2,
    slotsTotal: 6,
    members: makeSlots(2, 6),
    skills: byId("collab-6").skills,
    description:
      "The API reference section needs another pass after the library renamed several methods.",
    workItems: ["Update renamed methods", "Fix code examples"],
    photos: [],
    owner: byId("collab-6").owner,
    myStatus: "revise",
  },
];
