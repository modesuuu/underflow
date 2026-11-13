export interface InboxSummary {
  unreadCount: number;
}

/**
 * Lifecycle of a collab application as it appears inside a thread —
 * mirrors the ApplyCta states on the collab detail page (pending →
 * entered/declined there; accepted/declined here, plus withdrawn when
 * the applicant cancels).
 */
export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn";

/**
 * The application attached to a conversation. "incoming" = the other
 * person applied to MY project (I get Accept/Decline); "outgoing" =
 * I applied to THEIRS (I see the sent status). Rendered as the
 * application card from Figma 386:5.
 */
export interface ThreadApplication {
  /** Backend application id (for the accept/decline endpoints). */
  applicationId: string;
  projectId: string;
  projectTitle: string;
  /** The project's need line, e.g. "Need Frontend Developer". */
  projectMeta: string;
  /** Preformatted deadline label, e.g. "Dec 25, 2026". */
  dueLabel: string;
  /** Filled/total slots, e.g. "2 / 4". */
  slotsLabel: string;
  direction: "incoming" | "outgoing";
  status: ApplicationStatus;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  /** Preformatted relative label ("1min", "2h") — mock data has no real clock. */
  timeLabel: string;
  /** Wall-clock "HH:MM", shown inside the chat bubble. */
  clock: string;
  /** Incoming only: not true = unread. Own messages are always read. */
  read?: boolean;
}

export interface Conversation {
  id: string;
  /** Canonical profile-registry id when the person is resolvable, else null. */
  personId: string | null;
  name: string;
  /** The other participant's profile photo, when they have one. */
  avatarUrl?: string;
  messages: ChatMessage[];
  /** Server unread count, trusted until the history is loaded. */
  serverUnread?: number;
  /** List-row preview while the history is not loaded yet. */
  preview?: { from: "me" | "them"; text: string; timeLabel: string };
  /** Last-activity timestamp (the server orders the list by it). */
  updatedAt?: string;
  /** Muted threads show the bell-off state (session model: their
   * unread still counts — the badge must always match the messages). */
  muted?: boolean;
  /** Pinned threads sort above the rest of the list. */
  pinned?: boolean;
  /** Thread kind from the backend; "system" = one-way announcements. */
  kind?: "direct" | "application" | "system";
  application?: ThreadApplication;
}
