import { apiFetch, type ApiEnvelope } from "@/lib/api-client";

/**
 * PUT /api/profiles/me with the photo fields only — the backend
 * updates just the fields present in the body, so a photo change
 * never touches the name, bio or social links. The URL and public
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

/** Current name + bio + profile detail for the Settings form. */
export interface ProfileBasics {
  fullName: string;
  bio: string;
  profileDetail: string;
}

interface BackendMe {
  full_name?: string;
  bio?: string;
  profile_detail?: string;
}

export async function getProfileBasics(): Promise<ProfileBasics> {
  const res = await apiFetch<ApiEnvelope<BackendMe>>("/api/profiles/me");
  return {
    fullName: res.data?.full_name ?? "",
    bio: res.data?.bio ?? "",
    profileDetail: res.data?.profile_detail ?? "",
  };
}

export async function updateProfileBasics(
  fullName: string,
  bio: string,
  profileDetail: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify({
      full_name: fullName,
      bio,
      profile_detail: profileDetail,
    }),
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
