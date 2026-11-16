import { ApiEnvelope, apiFetch } from "@/lib/api-client";
import { formatDueDate } from "@/features/collaborations/sort";
import { localeTag } from "@/lib/i18n/format";
import type { ApplicationRow, ApplicationListStatus } from "./types";

interface BackendApplicationPerson {
  id: string;
  username: string;
  photo_profile_url: string;
}

interface BackendApplication {
  id: string;
  collab_id: string;
  project_title: string;
  due_date: string | null;
  status: ApplicationListStatus;
  direction: "incoming" | "outgoing";
  message: string | null;
  created_at: string;
  applicant: BackendApplicationPerson;
  owner: BackendApplicationPerson;
}

function mapApplication(b: BackendApplication): ApplicationRow {
  const other = b.direction === "incoming" ? b.applicant : b.owner;
  return {
    id: b.id,
    collabId: b.collab_id,
    projectTitle: b.project_title,
    dueLabel: b.due_date ? formatDueDate(b.due_date) : null,
    status: b.status,
    direction: b.direction,
    message: b.message,
    createdLabel: new Intl.DateTimeFormat(localeTag(), {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(b.created_at)),
    other: {
      id: other.id,
      username: other.username,
      photoUrl: other.photo_profile_url || undefined,
    },
  };
}

/** GET /api/applications?scope=... (audit P1 #12). */
export async function getApplications(
  scope: "incoming" | "outgoing",
): Promise<ApplicationRow[]> {
  const res = await apiFetch<ApiEnvelope<BackendApplication[]>>(
    "/api/applications?scope=" + scope,
  );
  return (res.data ?? []).map(mapApplication);
}
