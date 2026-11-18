// features/circle/api.ts
import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import type {
  CircleDetail,
  CircleSummary,
  CircleZone,
  ZoneMessage,
  ZoneMessagePage,
} from "./types";

/** GET /api/circles — circles the session user owns or is a member of. */
export async function getCircles(): Promise<CircleSummary[]> {
  if (!isApiConfigured()) return [];
  const res = await apiFetch<ApiEnvelope<CircleSummary[]>>("/api/circles");
  return res.data;
}

/**
 * GET /api/circles/:circleId — detail with zones + members.
 * Throws ApiError (403 for non-members, 404 for unknown ids).
 */
export async function getCircleDetail(
  circleId: string
): Promise<CircleDetail> {
  const res = await apiFetch<ApiEnvelope<CircleDetail>>(
    `/api/circles/${circleId}`
  );
  return res.data;
}

/**
 * POST /api/collab/:collabId/circle — the owner creates the Circle
 * after the fact (the "decide later" / external-link path at creation
 * time). Returns the fresh detail, zones included.
 */
export async function createCircle(
  collabId: string,
  title?: string
): Promise<CircleDetail> {
  const res = await apiFetch<ApiEnvelope<CircleDetail>>(
    `/api/collab/${collabId}/circle`,
    {
      method: "POST",
      body: JSON.stringify(title ? { title } : {}),
    }
  );
  return res.data;
}

/**
 * GET /api/circles/:circleId/zones/:zoneId/messages — one page of
 * zone history in chronological order. Pass the oldest loaded
 * message as `before` to fetch the page before it.
 */
export async function getZoneMessages(
  circleId: string,
  zoneId: string,
  options?: { limit?: number; before?: ZoneMessage }
): Promise<ZoneMessagePage> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.before) {
    params.set("before_ts", options.before.createdAt);
    params.set("before_id", options.before.id);
  }
  const qs = params.toString();
  const res = await apiFetch<ApiEnvelope<ZoneMessagePage>>(
    `/api/circles/${circleId}/zones/${zoneId}/messages${qs ? `?${qs}` : ""}`
  );
  return res.data;
}

/**
 * POST /api/circles/:circleId/zones/:zoneId/messages — send one
 * text message. Returns the stored message (the same shape the
 * realtime push carries). Throws ApiError: 403 when the zone does
 * not allow this user to post, 400 for empty / over-long content.
 */
export async function sendZoneMessage(
  circleId: string,
  zoneId: string,
  content: string
): Promise<ZoneMessage> {
  const res = await apiFetch<ApiEnvelope<ZoneMessage>>(
    `/api/circles/${circleId}/zones/${zoneId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
  return res.data;
}

/** Create a zone in a circle (owner only; the backend enforces). */
export async function createZone(
  circleId: string,
  input: { title: string; allowPublicMessage: boolean }
): Promise<CircleZone> {
  const res = await apiFetch<ApiEnvelope<CircleZone>>(
    `/api/circles/${circleId}/zones`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}

/** Update a zone's title and/or posting permission (owner only). */
export async function updateZone(
  circleId: string,
  zoneId: string,
  input: { title?: string; allowPublicMessage?: boolean }
): Promise<CircleZone> {
  const res = await apiFetch<ApiEnvelope<CircleZone>>(
    `/api/circles/${circleId}/zones/${zoneId}`,
    { method: "PUT", body: JSON.stringify(input) }
  );
  return res.data;
}

/** Delete a zone and all its messages (owner only, never the last zone). */
export async function deleteZone(
  circleId: string,
  zoneId: string
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/circles/${circleId}/zones/${zoneId}`,
    { method: "DELETE" }
  );
}

/** Update a circle's title and/or photo (owner only). Returns the fresh detail. */
export async function updateCircle(
  circleId: string,
  input: { title?: string; photoUrl?: string | null }
): Promise<CircleDetail> {
  const res = await apiFetch<ApiEnvelope<CircleDetail>>(
    `/api/circles/${circleId}`,
    { method: "PUT", body: JSON.stringify(input) }
  );
  return res.data;
}

/** Delete a circle with all its zones and messages (owner only). */
export async function deleteCircle(circleId: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/api/circles/${circleId}`, {
    method: "DELETE",
  });
}
/** Mark a zone as read for the session user (unread indicators). */
export async function markZoneRead(
  circleId: string,
  zoneId: string
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(
    `/api/circles/${circleId}/zones/${zoneId}/read`,
    { method: "POST" }
  );
}