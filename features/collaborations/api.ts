// features/collaborations/api.ts
import { ApiEnvelope, apiFetch, ApiError, isApiConfigured } from "@/lib/api-client";
import type { CollabMember, CollabProject, ProjectType } from "./types";

/** Wire shape of GET /api/collab (CollabModel::getAll, enriched 2026-11-10). */
interface BackendCollab {
  id: string;
  title: string;
  description?: string;
  type?: ProjectType;
  due_date?: string | null;
  status: CollabProject["status"];
  required_member: number;
  accepted_member_count: number;
  available_slots: number;
  my_application?: { status: "pending" | "accepted" | "declined" } | null;
  skills_needed: { id: string; skill_name: string; scope: string }[];
  owner: { id: string; username: string; photo_profile_url: string };
  created_at?: string;
}

function relativeAgo(iso: string | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return days + "d ago";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return hours + "h ago";
  return "just now";
}

export function mapBackendCollab(b: BackendCollab): CollabProject {
  const owner: CollabMember = {
    id: b.owner.id,
    name: b.owner.username,
    role: "Owner",
    avatarUrl: b.owner.photo_profile_url || undefined,
    isOwner: true,
  };
  const openSlots = Math.max(0, b.required_member - b.accepted_member_count);
  const members: CollabMember[] = [owner];
  for (let i = 0; i < openSlots; i++) {
    members.push({
      id: "open-" + b.id + "-" + i,
      name: "Open slot",
      role: "Open slot",
      isOpenSlot: true,
    });
  }
  const description = b.description ?? "";
  return {
    id: b.id,
    title: b.title,
    subtitle: description.split("\n")[0].slice(0, 80),
    status: b.status,
    type: b.type ?? "coursework",
    dueDate: b.due_date ?? "",
    postedAt: b.created_at ?? "",
    postedAgo: relativeAgo(b.created_at),
    slotsFilled: b.accepted_member_count,
    myApplication: b.my_application?.status ?? null,
    slotsTotal: b.required_member,
    members,
    skills: (b.skills_needed ?? []).map((s) => ({
      id: s.id,
      label: s.skill_name,
    })),
    description,
    workItems: [],
    photos: [],
    owner,
  };
}

export async function getCollabProjects(): Promise<CollabProject[]> {
  if (isApiConfigured()) {
    try {
      const res = await apiFetch<ApiEnvelope<BackendCollab[]>>("/api/collab");
      return res.data.map(mapBackendCollab);
    } catch (err) {
      // Backend unreachable (server down): return an empty list
      // instead of crashing the page.
      if (err instanceof ApiError && err.code === "network_error") {
        return [];
      }
      throw err;
    }
  }
  return [];
}

export async function getCollabProject(
  id: string
): Promise<CollabProject | undefined> {
  if (isApiConfigured()) {
    try {
      const res = await apiFetch<ApiEnvelope<BackendCollab>>(
        `/api/collab/${id}`
      );
      return mapBackendCollab(res.data);
    } catch (err) {
      // Unknown id → 404 envelope → undefined (page renders notFound()).
      if (err instanceof ApiError && err.status === 404) return undefined;
      // Backend unreachable (server down): return undefined.
      if (err instanceof ApiError && err.code === "network_error") {
        return undefined;
      }
      throw err;
    }
  }
  return undefined;
}

/**
 * Authed detail fetch (client-side only: apiFetch attaches the session
 * token there, so the payload carries my_application + fresh seats).
 * Used by the detail page to fill in the Apply CTA state after the
 * server render. Returns undefined on 404, like getCollabProject.
 */
export async function getCollabProjectAuthed(
  id: string
): Promise<CollabProject | undefined> {
  if (!isApiConfigured()) return undefined;
  try {
    const res = await apiFetch<ApiEnvelope<BackendCollab>>(
      `/api/collab/${id}`
    );
    return mapBackendCollab(res.data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

/**
 * Pull the backend's message out of an ApiError
 * ("API request failed: 409 Collaboration is full (/api/...)") so
 * toasts show the reason, not the wire wrapper.
 */
export function backendErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const m = /^API request failed: \d+(?: \([^)]*\))? (.*) \([^)]*\)$/.exec(
      err.message
    );
    if (m) return m[1];
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

/**
 * Contract wire payload (docs/api-contract.md `CreateCollabInput`).
 * `photoUrls` come from a PRIOR POST /api/upload — the two-step
 * upload-then-create flow the contract mandates (audit P1-A #9).
 */
export interface CreateCollabInput {
  title: string;
  description: string;
  skillIds: string[]; // references SkillTag.id
  customRoles: string[];
  slotsTotal: number;
  type: ProjectType;
  dueDate: string; // ISO 8601
  photoUrls: string[];
}

/**
 * Form-level payload: raw Files instead of URLs — the api layer uploads them
 * first and swaps in the returned URLs. `type`/`dueDate` are contract-required
 * but the form does not collect them yet (later iteration); until the fields
 * land in the UI the payload omits them and the real backend 400s — expected.
 */
export interface CreateCollabFormInput
  extends Omit<CreateCollabInput, "photoUrls" | "type" | "dueDate"> {
  photos: File[];
  type?: ProjectType;
  dueDate?: string;
}

// The backend's create expects title, description, required_member
// and skills_needed (existing skill ids); type/due_date are sent too
// so the endpoint can store them once it reads them. Photos cannot be
// uploaded yet — POST /api/upload does not exist (TODO backend).
export async function createCollabProject(
  data: CreateCollabFormInput
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    await apiFetch<ApiEnvelope<unknown>>("/api/collab", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        required_member: data.slotsTotal,
        skills_needed: data.skillIds,
        type: data.type,
        due_date: data.dueDate,
        media_urls: [],
      }),
    });
    return { success: true };
  }
  return { success: true };
}

export type ApplyResult = { success: boolean; alreadyApplied?: boolean };

/**
 * POST /api/collab/:id/apply (backend Batch 2). Sends the applicant's
 * message with the application; the owner sees it in the applications
 * list. A 409 "Already applied" is NOT an error for the UI - the
 * application already exists, so the caller shows Pending. Any other
 * 409 (e.g. collab full) or error is rethrown for a toast.
 */
export async function applyToCollab(
  projectId: string,
  message?: string
): Promise<ApplyResult> {
  if (isApiConfigured()) {
    try {
      await apiFetch<ApiEnvelope<unknown>>(
        `/api/collab/${projectId}/apply`,
        {
          method: "POST",
          body: JSON.stringify({ message: message ?? "" }),
        }
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.includes("Already applied")
      ) {
        return { success: true, alreadyApplied: true };
      }
      throw err;
    }
  }
  return { success: true };
}

/** One row of GET /api/collab/:id/applications (owner only). */
export interface CollabApplication {
  id: string;
  user_id: string;
  username: string;
  photo_profile_url: string;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

/** GET /api/collab/:id/applications - pending first, then decided. */
export async function getCollabApplications(
  projectId: string
): Promise<CollabApplication[]> {
  const res = await apiFetch<ApiEnvelope<CollabApplication[]>>(
    `/api/collab/${projectId}/applications`
  );
  return res.data;
}

/** PUT .../applications/:id/accept - returns the fresh seat counts. */
export async function acceptCollabApplication(
  projectId: string,
  applicationId: string
): Promise<{ accepted_member_count: number; available_slots: number }> {
  const res = await apiFetch<
    ApiEnvelope<{
      application: CollabApplication;
      accepted_member_count: number;
      available_slots: number;
    }>
  >(`/api/collab/${projectId}/applications/${applicationId}/accept`, {
    method: "PUT",
  });
  return res.data;
}

/** PUT .../applications/:id/decline. */
export async function declineCollabApplication(
  projectId: string,
  applicationId: string
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/collab/${projectId}/applications/${applicationId}/decline`,
    { method: "PUT" }
  );
}
