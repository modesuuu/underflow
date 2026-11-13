import {
  ApiError,
  apiFetch,
  getApiBaseUrl,
  type ApiEnvelope,
} from "@/lib/api-client";

/**
 * Appeals transport (spec-admin.md §4.4/§4.5). User side: file an
 * appeal against a moderation action (from the system thread) or
 * against an active suspension (from the login screen, no session).
 */

export type AppealStatus = "pending" | "granted" | "denied";

export interface MyAppeal {
  id: string;
  moderation_action_id: string;
  message: string;
  status: AppealStatus;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
  action_type: string | null;
  target_type: string | null;
  target_id: string | null;
}

export async function getMyAppeals(): Promise<MyAppeal[]> {
  const res = await apiFetch<ApiEnvelope<{ appeals: MyAppeal[] }>>(
    "/api/appeals",
  );
  return res.data.appeals;
}

export async function createAppeal(
  moderationActionId: string,
  message: string,
): Promise<MyAppeal> {
  const res = await apiFetch<ApiEnvelope<{ appeal: MyAppeal }>>("/api/appeals", {
    method: "POST",
    body: JSON.stringify({
      moderation_action_id: moderationActionId,
      message,
    }),
  });
  return res.data.appeal;
}

export interface SuspendedAppealInput {
  username?: string;
  password?: string;
  idToken?: string;
  message: string;
}

/**
 * Appeal from the login screen. No session exists, so this is a plain
 * fetch: the credentials in the body are the verification.
 */
export async function createSuspendedAppeal(
  input: SuspendedAppealInput,
): Promise<MyAppeal> {
  const res = await fetch(`${getApiBaseUrl()}/api/appeals/suspended`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      id_token: input.idToken,
      message: input.message,
    }),
  });
  type SuspendedAppealResponse = {
    success: boolean;
    message: string;
    data: { appeal: MyAppeal } | null;
  };
  let body: SuspendedAppealResponse | null = null;
  try {
    body = (await res.json()) as SuspendedAppealResponse;
  } catch {
    body = null;
  }
  if (!res.ok || !body?.success || !body.data?.appeal) {
    throw new ApiError(
      res.status,
      "appeal_failed",
      body?.message || "Could not send your appeal.",
    );
  }
  return body.data.appeal;
}
