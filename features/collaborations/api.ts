// features/collaborations/api.ts
import { ApiEnvelope, apiFetch, ApiError, isApiConfigured } from "@/lib/api-client";
import type { CollabMember, CollabProject, CollabSortKey, ProjectType } from "./types";
import { SYSTEM_SKILL_ICONS } from "./skills-api";
import { uploadImage } from "@/features/dashboard/api";

/** Wire shape of GET /api/collab (CollabModel::getAll, enriched 2026-11-10). */
interface BackendCollab {
  id: string;
  title: string;
  description?: string;
  type?: ProjectType;
  due_date?: string | null;
  media_urls?: string[];
  media_public_ids?: (string | null)[];
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
      // The detail pages render SkillTag.icon; only the static system
      // skills have one (same map as the modal chips).
      icon: s.scope === "system" ? SYSTEM_SKILL_ICONS[s.skill_name] : undefined,
    })),
    description,
    photos: [...(b.media_urls ?? [])],
    photoPublicIds: (b.media_urls ?? []).map(
      (_, i) => b.media_public_ids?.[i] ?? null
    ),
    owner,
  };
}

/** Cards per page of the collab river; "Show more" fetches the next page. */
export const COLLAB_PAGE_SIZE = 12;

/** Backend `pagination` meta for GET /api/collab (audit P2-12). */
export interface CollabPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * One server-paged list result. `loadError` is true ONLY when the fetch
 * failed with `network_error` (backend down) — the list page renders its
 * distinct error state for that instead of "No projects found" (audit
 * P2-9). Any other failure still throws to the route error boundary.
 */
export interface CollabListResult {
  projects: CollabProject[];
  pagination: CollabPagination;
  loadError: boolean;
}

function toBackendSort(sortKey: CollabSortKey): string | undefined {
  // "recommended" is the backend's default order (created_at DESC) —
  // no sort param, so the backend stays the single source of that order.
  if (sortKey === "recommended") return undefined;
  return sortKey;
}

/**
 * GET /api/collab?page&limit&q&sort — one server-side page (audit P2-12).
 * Search + sort run on the backend; the caller only appends/replaces.
 */
export async function getCollabProjectsPage(options?: {
  q?: string;
  sort?: CollabSortKey;
  page?: number;
  limit?: number;
}): Promise<CollabListResult> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? COLLAB_PAGE_SIZE;
  const emptyPage: CollabListResult = {
    projects: [],
    pagination: { page, limit, total: 0, total_pages: 0 },
    loadError: false,
  };
  if (!isApiConfigured()) return emptyPage;
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  const q = (options?.q ?? "").trim();
  if (q) params.set("q", q);
  const sort = toBackendSort(options?.sort ?? "recommended");
  if (sort) params.set("sort", sort);
  try {
    const res = await apiFetch<ApiEnvelope<BackendCollab[]>>(
      `/api/collab?${params.toString()}`
    );
    return {
      projects: res.data.map(mapBackendCollab),
      pagination: res.pagination ?? {
        page,
        limit,
        total: res.data.length,
        total_pages: 1,
      },
      loadError: false,
    };
  } catch (err) {
    // Backend unreachable (server down): signal the error state instead
    // of an empty list — the caller must not render "No projects found".
    if (err instanceof ApiError && err.code === "network_error") {
      return { ...emptyPage, loadError: true };
    }
    throw err;
  }
}

/**
 * Full project list for callers that need every collab (profile stats,
 * mobile search popular terms) — pages through the server list until
 * total_pages. The /collaborations grid does NOT use this; it pages
 * through getCollabProjectsPage instead.
 */
export async function getCollabProjects(): Promise<CollabProject[]> {
  if (!isApiConfigured()) return [];
  const all: CollabProject[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const result = await getCollabProjectsPage({ page, limit: 50 });
    if (result.loadError) return [];
    all.push(...result.projects);
    totalPages = result.pagination.total_pages;
    page += 1;
  }
  return all;
}

/**
 * GET /api/collab/:id. Returns null for an unknown id (the detail page
 * renders notFound()); THROWS on network_error so the detail page can
 * render its backend-down error state instead of a 404 (audit P2-9).
 */
export async function getCollabProject(
  id: string
): Promise<CollabProject | null> {
  if (!isApiConfigured()) return null;
  try {
    const res = await apiFetch<ApiEnvelope<BackendCollab>>(
      `/api/collab/${id}`
    );
    return mapBackendCollab(res.data);
  } catch (err) {
    // Unknown id → 404 envelope → null (page renders notFound()).
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Authed detail fetch (client-side only: apiFetch attaches the session
 * token there, so the payload carries my_application + fresh seats).
 * Used by the detail page to fill in the Apply CTA state after the
 * server render. Returns undefined on 404, like getCollabProject returns
 * null there. Network errors throw — callers already swallow them and
 * keep the server-rendered project.
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
  slotsTotal: number;
  dueDate: string; // ISO 8601 ("" = no due date)
  photoUrls: string[];
}

/**
 * Form-level payload: raw Files instead of URLs — the api layer uploads them
 * first (POST /api/upload, same as PostModal) and swaps in the returned
 * URLs. `dueDate` is collected by MakeCollabModal ("" means no due
 * date, sent as null). The project type is NOT collected: it is never
 * shown anywhere in the app, so the backend stores its default.
 */
export interface CreateCollabFormInput
  extends Omit<CreateCollabInput, "photoUrls"> {
  photos: File[];
}

// The backend's create expects title, description, required_member
// and skills_needed (existing skill ids); due_date/media_urls are
// stored too. Photos are uploaded first (POST /api/upload, same as
// PostModal) — an upload failure throws, the modal shows it inline and
// keeps the draft; the collab is only created once every upload succeeds.
export async function createCollabProject(
  data: CreateCollabFormInput
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    const uploaded =
      data.photos.length > 0
        ? await Promise.all(data.photos.map((file) => uploadImage(file)))
        : [];
    await apiFetch<ApiEnvelope<unknown>>("/api/collab", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        required_member: data.slotsTotal,
        skills_needed: data.skillIds,
        due_date: data.dueDate || null,
        media_urls: uploaded.map((item) => item.url),
        media_public_ids: uploaded.map((item) => item.public_id),
      }),
    });
    return { success: true };
  }
  return { success: true };
}

/**
 * PUT /api/collab/:id (owner only — the backend answers 403 otherwise).
 * Same form payload as create, plus the photos the project already
 * has: their URLs + public ids go back paired with any new uploads,
 * because the backend replaces the media set wholesale (DELETE +
 * INSERT) whenever a paired set arrives; an empty pair clears all
 * photos. dueDate "" is sent as null, which the backend reads as
 * "clear the date".
 */
export interface UpdateCollabFormInput extends CreateCollabFormInput {
  existingPhotos: { url: string; publicId: string | null }[];
}

export async function updateCollabProject(
  id: string,
  data: UpdateCollabFormInput
): Promise<{ success: boolean }> {
  if (isApiConfigured()) {
    const uploaded =
      data.photos.length > 0
        ? await Promise.all(data.photos.map((file) => uploadImage(file)))
        : [];
    await apiFetch<ApiEnvelope<unknown>>(`/api/collab/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        required_member: data.slotsTotal,
        skills_needed: data.skillIds,
        due_date: data.dueDate || null,
        media_urls: [
          ...data.existingPhotos.map((p) => p.url),
          ...uploaded.map((item) => item.url),
        ],
        media_public_ids: [
          ...data.existingPhotos.map((p) => p.publicId),
          ...uploaded.map((item) => item.public_id),
        ],
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
