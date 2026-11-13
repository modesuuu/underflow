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
