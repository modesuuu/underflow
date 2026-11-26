// features/planner/types.ts
// Wire shapes for the collab Planner (Tasks Fase 1 + wiring 2026-11-26),
// mirroring PlannerController::presentTask / presentMember / presentSection.
import type { Block } from "./components/BlockBody";

export type PlannerRole = "owner" | "pm" | "member";

export interface PlannerMember {
  id: string;
  username: string;
  name: string;
  photo: string | null;
  /** Job role shown in the Who column (not the planner role). */
  jobRole: string | null;
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
  /** Start of the pill (YYYY-MM-DD or null); dueDate is the end. */
  startDate: string | null;
  /** Boxicons icon name from the detail picker. */
  icon: string | null;
  /** BlockBody blocks (null when the task has none stored). */
  blocks: Block[] | null;
  /** Tentative pill style. */
  pencilled: boolean;
  follows: { id: string; title: string } | null;
  gapDays: number | null;
  done: boolean;
  doneAt: string | null;
  createdAt: string | null;
  /** Vertical order inside a day (server `position`): the tiebreaker
   * the board's ORDER BY uses after due_date, so the lane order a
   * drag sets survives a refresh. */
  position: number;
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

/** One team board the user can open (GET /api/me/planners). */
export interface PlannerBoardSummary {
  collabId: string;
  title: string;
  openCount: number;
}

export interface TaskInput {
  title: string;
  sectionId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  icon?: string | null;
  blocks?: Block[] | null;
  pencilled?: boolean;
  followsTaskId?: string | null;
}

export interface TaskUpdate {
  title?: string;
  sectionId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  icon?: string | null;
  blocks?: Block[] | null;
  pencilled?: boolean;
  followsTaskId?: string | null;
  done?: boolean;
  /** Vertical order inside a day: sent on drag so the lane order
   * survives a board refresh (server ORDER BY: due_date, position). */
  position?: number;
}

export interface UpdateTaskResult {
  task: PlannerTask;
  shiftedTaskIds: string[];
}
