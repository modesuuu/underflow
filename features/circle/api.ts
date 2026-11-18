// features/circle/api.ts
import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import type { CircleDetail, CircleSummary } from "./types";

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
