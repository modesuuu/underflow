// features/planner/types.ts
// Wire shapes for the collab Planner (Tasks Fase 1), mirroring
// PlannerController::presentTask / presentMember / presentSection.

export type PlannerRole = "owner" | "pm" | "member";

export interface PlannerMember {
  id: string;
  username: string;
  name: string;
  photo: string | null;
  role: PlannerRole;
}

export interface PlannerSection {
  id: string;
  title: string;
  position: number;
}

export interface PlannerPerson {
  id: string;
  username: string;
  name: string;
  photo: string | null;
}

export interface PlannerTask {
  id: string;
  collabId: string;
  sectionId: string | null;
  title: string;
  assignee: PlannerPerson | null;
  createdBy: { id: string; username: string };
  /** YYYY-MM-DD or null. */
  dueDate: string | null;
  follows: { id: string; title: string } | null;
  gapDays: number | null;
  done: boolean;
  doneAt: string | null;
  createdAt: string | null;
  /** Only present on /api/me/tasks rows. */
  collabTitle?: string;
}

export interface PlannerData {
  collabId: string;
  enabled: boolean;
  myRole: PlannerRole;
  members: PlannerMember[];
  sections: PlannerSection[];
  tasks: PlannerTask[];
}

export interface MyTasksData {
  tasks: PlannerTask[];
  counts: { open: number; overdue: number; doneThisWeek: number };
  /** Server-side today (Asia/Jakarta), YYYY-MM-DD. Grouping anchors to this. */
  today: string;
}

export interface TaskInput {
  title: string;
  sectionId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  followsTaskId?: string | null;
}

export interface TaskUpdate {
  title?: string;
  sectionId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  followsTaskId?: string | null;
  done?: boolean;
}

export interface UpdateTaskResult {
  task: PlannerTask;
  shiftedTaskIds: string[];
}
