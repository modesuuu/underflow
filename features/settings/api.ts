import { apiFetch, type ApiEnvelope } from "@/lib/api-client";

/**
 * PUT /api/profiles/me with the photo fields only — the backend
 * updates just the fields present in the body, so a photo change
 * never touches the name or social links. The URL and public
 * id come from the direct-to-Cloudinary upload (uploadImage in
 * features/dashboard/api.ts).
 */
export async function updateProfilePhoto(
  url: string,
  publicId: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify({
      photo_profile_url: url,
      photo_profile_public_id: publicId,
    }),
  });
}

/** One stored social / portfolio link (a backend social_media row). */
export interface ProfileLink {
  platform: string;
  url: string;
}

/** Everything the Settings → Profile form edits, loaded and saved
 *  as one payload: the backend updates only the fields present and
 *  wraps the whole PUT in a transaction, so the page's single Save
 *  button is atomic — nothing half-saves. */
export interface ProfileFormData {
  fullName: string;
  profileDetail: string;
  links: ProfileLink[];
}

interface BackendMe {
  full_name?: string;
  bio?: string;
  profile_detail?: string;
  social_media?: ProfileLink[];
  skills?: { id: string }[];
}

export async function getProfileForm(): Promise<ProfileFormData> {
  const res = await apiFetch<ApiEnvelope<BackendMe>>("/api/profiles/me");
  return {
    fullName: res.data?.full_name ?? "",
    profileDetail: res.data?.profile_detail ?? "",
    links: res.data?.social_media ?? [],
  };
}

export async function updateProfileForm(
  data: ProfileFormData,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify({
      full_name: data.fullName,
      profile_detail: data.profileDetail,
      social_media: data.links,
    }),
  });
}

/** Skill ids currently shown on the user's profile: the backend's
 *  user_skill selection, returned by GET /api/profiles/me. */
export async function getProfileSkillIds(): Promise<string[]> {
  const res = await apiFetch<ApiEnvelope<BackendMe>>("/api/profiles/me");
  return (res.data?.skills ?? []).map((s) => s.id);
}

/** Replace the profile skill selection: PUT /api/profiles/me syncs
 *  the user_skill rows to exactly this id list in one transaction. */
export async function updateProfileSkills(skillIds: string[]): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify({ skills: skillIds }),
  });
}

/** Notification preferences (audit P1 #14). */
export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  applications: boolean;
  collab_status: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  likes: true,
  comments: true,
  applications: true,
  collab_status: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await apiFetch<ApiEnvelope<NotificationPreferences>>(
    "/api/settings/notification-preferences",
  );
  return res.data ?? DEFAULT_PREFS;
}

export async function updateNotificationPreferences(
  patchBody: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await apiFetch<ApiEnvelope<NotificationPreferences>>(
    "/api/settings/notification-preferences",
    { method: "PUT", body: JSON.stringify(patchBody) },
  );
  return res.data ?? DEFAULT_PREFS;
}

/** DELETE /api/account (audit P1 #14); the payload carries the
 *  confirmation the account's sign-in method requires. */
export async function deleteAccount(
  payload: Record<string, string>,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>("/api/account", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}
