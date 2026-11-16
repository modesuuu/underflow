export type ApplicationListStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn";

/**
 * One row of the central Applications page (audit P1 #12).
 * "incoming" = someone applied to MY project (other = applicant);
 * "outgoing" = I applied to THEIRS (other = project owner).
 */
export interface ApplicationRow {
  id: string;
  collabId: string;
  projectTitle: string;
  dueLabel: string | null;
  status: ApplicationListStatus;
  direction: "incoming" | "outgoing";
  message: string | null;
  createdLabel: string;
  other: { id: string; username: string; photoUrl?: string };
}
