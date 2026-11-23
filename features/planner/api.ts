// features/planner/api.ts
import { ApiEnvelope, apiFetch, isApiConfigured } from "@/lib/api-client";
import type {
  MyTasksData,
  PlannerData,
  PlannerSection,
  PlannerTask,
  TaskInput,
  TaskUpdate,
  UpdateTaskResult,
} from "./types";

const base = (collabId: string) => `/api/collab/${collabId}/planner`;

/** GET /api/collab/:id/planner — throws ApiError 403 for non-members. */
export async function getPlanner(collabId: string): Promise<PlannerData> {
  const res = await apiFetch<ApiEnvelope<PlannerData>>(base(collabId));
  return res.data;
}

export async function setPlannerEnabled(
  collabId: string,
  enabled: boolean
): Promise<void> {
  await apiFetch(`${base(collabId)}/${enabled ? "enable" : "disable"}`, {
    method: "POST",
  });
}

export async function setPlannerRole(
  collabId: string,
  userId: string,
  role: "pm" | "member"
): Promise<void> {
  await apiFetch(`${base(collabId)}/roles`, {
    method: "PUT",
    body: JSON.stringify({ userId, role }),
  });
}

export async function createPlannerSection(
  collabId: string,
  title: string
): Promise<PlannerSection> {
  const res = await apiFetch<ApiEnvelope<PlannerSection>>(
    `${base(collabId)}/sections`,
    { method: "POST", body: JSON.stringify({ title }) }
  );
  return res.data;
}

export async function renamePlannerSection(
  collabId: string,
  sectionId: string,
  title: string
): Promise<PlannerSection> {
  const res = await apiFetch<ApiEnvelope<PlannerSection>>(
    `${base(collabId)}/sections/${sectionId}`,
    { method: "PUT", body: JSON.stringify({ title }) }
  );
  return res.data;
}

export async function deletePlannerSection(
  collabId: string,
  sectionId: string
): Promise<void> {
  await apiFetch(`${base(collabId)}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export async function createPlannerTask(
  collabId: string,
  input: TaskInput
): Promise<PlannerTask> {
  const res = await apiFetch<ApiEnvelope<PlannerTask>>(
    `${base(collabId)}/tasks`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}

export async function updatePlannerTask(
  collabId: string,
  taskId: string,
  update: TaskUpdate
): Promise<UpdateTaskResult> {
  const res = await apiFetch<ApiEnvelope<UpdateTaskResult>>(
    `${base(collabId)}/tasks/${taskId}`,
    { method: "PUT", body: JSON.stringify(update) }
  );
  return res.data;
}

export async function deletePlannerTask(
  collabId: string,
  taskId: string
): Promise<void> {
  await apiFetch(`${base(collabId)}/tasks/${taskId}`, { method: "DELETE" });
}

/** GET /api/me/tasks — my tasks across every collab planner. */
export async function getMyTasks(): Promise<MyTasksData | null> {
  if (!isApiConfigured()) return null;
  const res = await apiFetch<ApiEnvelope<MyTasksData>>("/api/me/tasks");
  return res.data;
}
