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

export async function applyToCollab(
  _projectId: string
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    try {
      await apiFetch<ApiEnvelope<unknown>>(
        `/api/collab/${_projectId}/apply`,
        { method: "POST" }
      );
    } catch (err) {
      // TODO(backend): POST /api/collab/:id/apply does not exist yet.
      // Fall back to the session-only application thread until it lands.
      if (err instanceof ApiError && err.status === 404) return { success: true };
      throw err;
    }
  }
  return { success: true };
}