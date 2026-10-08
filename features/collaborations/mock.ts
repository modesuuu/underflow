// features/collaborations/mock.ts
import type { CollabMember, CollabProject, SkillTag } from "./types";

const SKILLS: SkillTag[] = [
  { id: "s1", label: "Coding", icon: "code-alt" },
  { id: "s2", label: "UI Design", icon: "palette" },
  { id: "s3", label: "Backend", icon: "server" },
  { id: "s4", label: "Testing", icon: "bug" },
  { id: "s5", label: "DevOps", icon: "terminal" },
  { id: "s6", label: "Mobile", icon: "mobile-alt" },
  { id: "s7", label: "Data", icon: "bar-chart-alt-2" },
  { id: "s8", label: "Writing", icon: "pencil" },
];

const OWNER = {
  id: "m-owner",
  name: "Russel",
  role: "Owner • Fullstack",
  isOwner: true,
};

const MEMBER_KIMI = {
  id: "m-kimi",
  name: "Kimi",
  role: "UI Designer",
};

const MEMBER_ALEX = {
  id: "m-alex",
  name: "Alex",
  role: "Backend Dev",
};

const MEMBER_JENNY = {
  id: "m-jenny",
  name: "Jenny",
  role: "ML Engineer",
};

/**
 * Build a member list that is internally consistent:
 * the first `filled` entries are real members, the rest are open slots.
 * Total array length always equals `total`, so
 * members.filter(m => !m.isOpenSlot).length === filled by construction.
 */
function makeSlots(filled: number, total: number): CollabMember[] {
  const real: CollabMember[] = [OWNER, MEMBER_KIMI, MEMBER_ALEX, MEMBER_JENNY];
  const members: CollabMember[] = real.slice(0, filled);
  // Start from the FILLED count (members.length), not the pool size —
  // otherwise open slots are silently dropped when filled < pool (audit P0-1).
  for (let i = members.length; i < total; i++) {
    members.push({
      id: `slot-${i}`,
      name: "Open slot",
      role: "Waiting...",
      isOpenSlot: true,
    });
  }
  return members;
}

export const COLLAB_PROJECTS: CollabProject[] = [
  {
    id: "collab-1",
    title: "SME Cashier App",
    subtitle: "Need Frontend...",
    status: "open",
    type: "portfolio",
    dueDate: "2026-12-25",
    postedAt: "2026-10-04T00:00:00Z",
    postedAgo: "3d ago",
    slotsFilled: 2,
    slotsTotal: 4,
    members: makeSlots(2, 4),
    skills: SKILLS.slice(0, 8),
    description:
      "Looking for a frontend developer to build a web-based cashier app for SMEs. The backend is 70% done (built by the owner) — what's left is integrating it into the cashier UI: product page, cart, checkout, and transaction history. Free choice of stack, as long as it's clean and responsive. Great for anyone who wants a real-world web app in their portfolio.",
    workItems: [
      "Slicing UI for product, cart, and checkout pages from Figma",
      "Integrating the provided backend REST API",
      "Building responsive layouts (mobile & desktop)",
      "Testing with the team before launch",
    ],
    photos: ["photo-1", "photo-2", "photo-3", "photo-4"],
    owner: OWNER,
  },
  {
    id: "collab-2",
    title: "Landing Page E-com",
    subtitle: "Need Frontend...",
    status: "open",
    type: "coursework",
    dueDate: "2026-12-25",
    postedAt: "2026-10-02T00:00:00Z",
    postedAgo: "5d ago",
    slotsFilled: 2,
    slotsTotal: 4,
    members: makeSlots(2, 4),
    skills: SKILLS.slice(0, 4),
    description:
      "Building a modern e-commerce landing page for a university project. Need help with responsive layout and animations.",
    workItems: ["Hero section with parallax", "Product grid", "Checkout flow UI"],
    photos: ["photo-1", "photo-2"],
    owner: OWNER,
  },
  {
    id: "collab-3",
    title: "Portfolio Builder",
    subtitle: "Need Designer...",
    status: "open",
    type: "product",
    dueDate: "2027-01-15",
    postedAt: "2026-09-27T00:00:00Z",
    postedAgo: "1d ago",
    slotsFilled: 4,
    slotsTotal: 4,
    members: makeSlots(4, 4),
    skills: SKILLS.slice(2, 6),
    description:
      "A drag-and-drop portfolio builder for students. All slots are filled — check back later for new openings.",
    workItems: ["Drag-and-drop editor", "Template system", "Export to static HTML"],
    photos: ["photo-1"],
    owner: OWNER,
  },
  {
    id: "collab-4",
    title: "Campus Event App",
    subtitle: "Need Backend...",
    status: "open",
    type: "coursework",
    dueDate: "2027-02-01",
    postedAt: "2026-09-24T00:00:00Z",
    postedAgo: "7d ago",
    slotsFilled: 1,
    slotsTotal: 3,
    members: makeSlots(1, 3),
    skills: SKILLS.slice(4, 8),
    description:
      "Mobile-first event management app for campus organizations. Looking for a backend dev to handle APIs and auth.",
    workItems: ["REST API design", "User authentication", "Push notifications"],
    photos: ["photo-1", "photo-2", "photo-3"],
    owner: OWNER,
  },
  {
    id: "collab-5",
    title: "AI Study Assistant",
    subtitle: "Need ML Eng...",
    status: "in-progress",
    type: "product",
    dueDate: "2027-03-10",
    postedAt: "2026-09-25T00:00:00Z",
    postedAgo: "2d ago",
    slotsFilled: 3,
    slotsTotal: 5,
    members: makeSlots(3, 5),
    skills: SKILLS,
    description:
      "An AI-powered study assistant that generates flashcards and quizzes from lecture notes. Looking for ML engineers and frontend devs.",
    workItems: [
      "NLP pipeline for note parsing",
      "Flashcard generation UI",
      "Spaced repetition algorithm",
      "Progress dashboard",
    ],
    photos: ["photo-1", "photo-2", "photo-3", "photo-4"],
    owner: OWNER,
  },
  {
    id: "collab-6",
    title: "Open Source Docs",
    subtitle: "Need Writers...",
    status: "open",
    type: "portfolio",
    dueDate: "2027-01-30",
    postedAt: "2026-09-29T00:00:00Z",
    postedAgo: "4d ago",
    slotsFilled: 2,
    slotsTotal: 6,
    members: makeSlots(2, 6),
    skills: SKILLS.slice(6, 8),
    description:
      "Contributing documentation for popular open-source libraries. Great for building a writing portfolio.",
    workItems: ["API reference docs", "Tutorial writing", "Code examples"],
    photos: [],
    owner: OWNER,
  },
];