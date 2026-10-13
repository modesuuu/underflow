import type { Conversation } from "./types";

/**
 * Seed threads for the session inbox store. The mix follows the flow
 * the product is built around (apply = message the owner):
 * - Hammilton and Kimi applied to MY projects → their threads carry an
 *   incoming application card with Accept/Decline.
 * - Russel owns the SME Cashier App I applied to → outgoing card.
 * - Hadjar is a plain working chat with no application attached.
 * Unread totals 5, matching the count the old static summary shipped.
 */
export const CONVERSATIONS_SEED: Conversation[] = [
  {
    id: "t-hammilton",
    personId: null,
    name: "Hammilton",
    unread: 3,
    messages: [
      {
        id: "t-hammilton-m1",
        from: "them",
        text: "Hi! I'd like to apply as Frontend Developer for Landing Page E-com v2. My portfolio is linked in my application.👋",
        timeLabel: "2h",
      },
      {
        id: "t-hammilton-m2",
        from: "them",
        text: "Quick question — is the project fully remote?",
        timeLabel: "1min",
      },
    ],
    application: {
      projectId: "my-landing-page-e-com-v2",
      projectTitle: "Landing Page E-com v2",
      projectMeta: "Need Frontend Developer",
      dueLabel: "Dec 25, 2026",
      slotsLabel: "2 / 4",
      direction: "incoming",
      status: "pending",
    },
  },
  {
    id: "t-kimi",
    personId: "m-kimi",
    name: "Kimi",
    unread: 2,
    messages: [
      {
        id: "t-kimi-m1",
        from: "them",
        text: "Hello! I'm applying as UI Designer for Design System Revamp.",
        timeLabel: "1h",
      },
      {
        id: "t-kimi-m2",
        from: "them",
        text: "I have experience building component libraries in Figma and React, so the design tokens part is right up my alley.",
        timeLabel: "26min",
      },
    ],
    application: {
      projectId: "my-design-system-revamp",
      projectTitle: "Design System Revamp",
      projectMeta: "Need Designers",
      dueLabel: "Jan 12, 2027",
      slotsLabel: "1 / 3",
      direction: "incoming",
      status: "pending",
    },
  },
  {
    id: "t-russel",
    personId: "m-owner",
    name: "Russel",
    unread: 0,
    messages: [
      {
        id: "t-russel-m1",
        from: "me",
        text: "Hi! I'm a 3rd-year informatics student. I've built 2 POS interfaces for class projects and I'm comfortable with React + Tailwind. I can commit around 8 hours/week until the deadline.",
        timeLabel: "3h",
      },
      {
        id: "t-russel-m2",
        from: "them",
        text: "Hi! Thanks for applying — I'll review your portfolio and get back to you.",
        timeLabel: "1h",
      },
    ],
    application: {
      projectId: "c-sme-cashier",
      projectTitle: "SME Cashier App",
      projectMeta: "Need Frontend Developer",
      dueLabel: "Dec 25, 2026",
      slotsLabel: "3 / 5",
      direction: "outgoing",
      status: "pending",
    },
  },
  {
    id: "t-hadjar",
    personId: null,
    name: "Hadjar",
    unread: 0,
    messages: [
      {
        id: "t-hadjar-m1",
        from: "them",
        text: "The API draft is ready — I pushed it to the shared doc.",
        timeLabel: "5h",
      },
      {
        id: "t-hadjar-m2",
        from: "me",
        text: "Nice, I'll review it tonight.",
        timeLabel: "3h",
      },
    ],
  },
];
