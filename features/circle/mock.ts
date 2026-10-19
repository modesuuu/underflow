// features/circle/mock.ts
import { MY_COLLAB_PROJECTS } from "@/features/my-collaborations/mock";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import { CURRENT_USER } from "@/components/layout/nav";
import type {
  ChannelId,
  CircleData,
  CircleMember,
  CircleMessage,
  CircleResource,
  Presence,
} from "./types";

/**
 * Circle V1 mock (spec-circle-v1 §2, §4). Membership derives from the My
 * Collaborations dataset so the two features can never disagree about
 * who is on a team: a project has a Circle unless the user's application
 * is still `pending`. Members are the project's filled slots (owner
 * first) plus the current user. Three projects carry written content;
 * every other eligible project gets a thin seed (one system message).
 * TODO(backend): GET /api/collaborations/:id/circle replaces all of it.
 */

export const CIRCLE_CHANNELS: { id: ChannelId; label: string }[] = [
  { id: "announcements", label: "announcements" },
  { id: "general", label: "general" },
];

/** Static V1 presence per person (same person, same state everywhere). */
const PRESENCE_BY_USER: Record<string, Presence> = {
  "m-owner": "online",
  "m-kimi": "idle",
  "m-alex": "online",
  "m-jenny": "offline",
  me: "online",
};

/** The current user's slot role, read off the project's own subtitle. */
const MY_ROLE_BY_SUBTITLE: [prefix: string, role: string][] = [
  ["Need Frontend", "Frontend Developer"],
  ["Need Designer", "UI Designer"],
  ["Need Designers", "UI Designer"],
  ["Need Backend", "Backend Developer"],
  ["Need Mobile", "Mobile Developer"],
  ["Need Writers", "Writer"],
  ["Need Builders", "Developer"],
  ["Need ML Eng", "ML Engineer"],
];

function myRole(project: MyCollabProject): string {
  const hit = MY_ROLE_BY_SUBTITLE.find(([prefix]) =>
    project.subtitle.startsWith(prefix),
  );
  return hit ? hit[1] : "Member";
}

export function circleMembers(project: MyCollabProject): CircleMember[] {
  const members: CircleMember[] = project.members
    .filter((m) => !m.isOpenSlot)
    .map((m) => ({
      userId: m.id,
      name: m.name,
      role: m.isOwner ? "Project Owner" : m.role,
      isOwner: Boolean(m.isOwner),
      avatarUrl: m.avatarUrl,
      presence: PRESENCE_BY_USER[m.id] ?? "offline",
    }));
  members.push({
    userId: "me",
    name: CURRENT_USER.name,
    role: myRole(project),
    isOwner: false,
    presence: PRESENCE_BY_USER.me,
  });
  return members;
}

type RawMessage = [
  id: string,
  channelId: ChannelId,
  authorId: string,
  createdAt: string,
  body: string,
  extra?: Partial<CircleMessage>,
];

function msg(raw: RawMessage): CircleMessage {
  const [id, channelId, authorId, createdAt, body, extra] = raw;
  return {
    id,
    channelId,
    authorId,
    kind: authorId === "system" ? "system" : "user",
    body,
    createdAt,
    reactions: [],
    pinned: false,
    attachments: [],
    ...extra,
  };
}

interface RichSeed {
  messages: CircleMessage[];
  resources: CircleResource[];
  lastRead: Record<ChannelId, string | null>;
}

const RICH: Record<string, RichSeed> = {
  "collab-1": {
    messages: [
      msg(["c1-a1", "announcements", "m-owner", "2026-10-17T09:05:00", "Welcome to the SME Cashier App circle. This channel is only for decisions and deadlines. Day to day talk goes in #general."]),
      msg(["c1-a2", "announcements", "m-owner", "2026-10-18T08:30:00", "Deadline update: cashier UI slices are due Friday, October 23. The cart and checkout endpoints are ready to integrate."]),
      msg(["c1-g1", "general", "system", "2026-10-17T09:02:00", "Kimi joined the circle."]),
      msg(["c1-g2", "general", "m-kimi", "2026-10-17T09:10:00", "Hi everyone. The latest cashier screens are in the Figma file, the cart flow is on page two."]),
      msg(["c1-g3", "general", "m-kimi", "2026-10-17T09:11:00", "The empty cart state is still missing. I am adding it today."]),
      msg(["c1-g4", "general", "m-owner", "2026-10-17T09:14:00", "Thanks Kimi. The checkout page still uses the old button style, can you swap it to the new one?"]),
      msg(["c1-g5", "general", "me", "2026-10-17T10:02:00", "I can start slicing the product page tomorrow. @Russel is the API doc in Resources the latest version?"]),
      msg(["c1-g6", "general", "m-owner", "2026-10-17T10:05:00", "Yes, version two. Cart and checkout are final.", { replyToId: "c1-g5" }]),
      msg(["c1-g7", "general", "m-kimi", "2026-10-18T09:20:00", "Morning. I updated the checkout button and added the empty cart state, both are in Figma now.", { reactions: [{ emoji: "👍", count: 1, reactedByMe: false }] }]),
      msg(["c1-g8", "general", "m-owner", "2026-10-18T09:45:00", "Pinning this: keep design questions in this channel until Friday so nothing gets lost in other chats.", { pinned: true }]),
    ],
    resources: [
      { id: "c1-r1", kind: "figma", label: "Cashier UI", url: "https://www.figma.com/design/sme-cashier-app", note: "Figma file" },
      { id: "c1-r2", kind: "github", label: "sme-cashier-api", url: "https://github.com/modesuuu/sme-cashier-api", note: "GitHub repository" },
      { id: "c1-r3", kind: "drive", label: "API documentation v2", url: "https://drive.google.com/sme-cashier-api-docs", note: "Google Drive" },
      { id: "c1-r4", kind: "deadline", label: "UI slices due", note: "Friday, October 23, 2026" },
    ],
    lastRead: { announcements: "c1-a2", general: "c1-g6" },
  },
  "my-collab-12": {
    messages: [
      msg(["e2-a1", "announcements", "m-owner", "2026-10-16T13:00:00", "Review round two is open. The hero section goes back for another pass. Everything else is approved."]),
      msg(["e2-g1", "general", "system", "2026-10-16T13:05:00", "Kimi joined the circle."]),
      msg(["e2-g2", "general", "m-kimi", "2026-10-16T13:20:00", "I left comments on the hero in Figma. The headline wraps to three lines on mobile, that is the main thing to fix."]),
      msg(["e2-g3", "general", "me", "2026-10-16T13:34:00", "I will rework the hero spacing tonight and push a new build tomorrow."]),
      msg(["e2-g4", "general", "m-owner", "2026-10-16T13:40:00", "Thanks. Keep the product photo where it is, only the spacing and the headline size change.", { reactions: [{ emoji: "👀", count: 1, reactedByMe: false }] }]),
      msg(["e2-g5", "general", "m-kimi", "2026-10-17T08:15:00", "One more thing: the price under the headline is hard to read on the photo. A darker overlay behind the text should fix it."]),
    ],
    resources: [
      { id: "e2-r1", kind: "figma", label: "Landing page v2", url: "https://www.figma.com/design/landing-page-ecom-v2", note: "Figma file" },
      { id: "e2-r2", kind: "link", label: "Live preview", url: "https://landing-ecom-v2.vercel.app", note: "Vercel deployment" },
      { id: "e2-r3", kind: "deadline", label: "Hero rework due", note: "Wednesday, October 21, 2026" },
    ],
    lastRead: { announcements: "e2-a1", general: "e2-g3" },
  },
  "collab-3": {
    messages: [
      msg(["p3-a1", "announcements", "m-owner", "2026-09-28T10:00:00", "Portfolio Builder is wrapped up. Thanks everyone, the final build is live."]),
      msg(["p3-g1", "general", "system", "2026-09-20T09:00:00", "Alex joined the circle."]),
      msg(["p3-g2", "general", "m-alex", "2026-09-20T09:05:00", "Hi all. I am setting up the project export today, PDF first, then a public link."]),
      msg(["p3-g3", "general", "m-jenny", "2026-09-20T09:12:00", "I can test the export on my portfolio once it is ready."]),
      msg(["p3-g4", "general", "m-owner", "2026-09-20T09:15:00", "Good. The deadline for the final build is Sunday."]),
      msg(["p3-g5", "general", "system", "2026-09-28T10:05:00", "This project was marked as complete."]),
    ],
    resources: [
      { id: "p3-r1", kind: "github", label: "portfolio-builder", url: "https://github.com/modesuuu/portfolio-builder", note: "GitHub repository" },
      { id: "p3-r2", kind: "link", label: "Final build", url: "https://portfolio-builder.vercel.app", note: "Vercel deployment" },
      { id: "p3-r3", kind: "figma", label: "Portfolio screens", url: "https://www.figma.com/design/portfolio-builder", note: "Figma file" },
    ],
    lastRead: { announcements: "p3-a1", general: "p3-g5" },
  },
};

/** Projects the current user has a Circle for (application not pending). */
export function eligibleProjects(): MyCollabProject[] {
  return MY_COLLAB_PROJECTS.filter((p) => p.myStatus !== "pending");
}

export function buildCircleData(project: MyCollabProject): CircleData {
  const rich = RICH[project.id];
  if (rich) {
    return {
      projectId: project.id,
      members: circleMembers(project),
      messages: rich.messages,
      resources: rich.resources,
      lastRead: rich.lastRead,
    };
  }
  const owner = project.members.find((m) => m.isOwner) ?? project.owner;
  return {
    projectId: project.id,
    members: circleMembers(project),
    messages: [
      msg([
        `${project.id}-g1`,
        "general",
        "system",
        project.postedAt ?? "2026-10-01T09:00:00",
        `${owner.name} joined the circle.`,
      ]),
    ],
    resources: [],
    lastRead: { announcements: null, general: null },
  };
}
