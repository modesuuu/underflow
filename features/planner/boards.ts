"use client";

// features/planner/boards.ts
// Boards own the planner's data in this phase. A board is
// either a team board attached to a collaboration (opt-in,
// like Circle: a collab may or may not have one) or a
// personal board owned by one user. Boards persist locally
// (localStorage, versioned key) until the planner API grows
// a boards concept; the shapes are written the way the API
// would return them, so the later swap is a data-source
// change, not a remodel.

import { useSyncExternalStore } from "react";
import { makeBlock } from "./components/BlockBody";
import type { Block } from "./components/BlockBody";
import { getMyPlanners } from "./api";

export type PlannerTaskData = {
  title: string;
  icon?: string;
  done?: boolean;
  pencilled?: boolean;
  overdue?: boolean;
  follows?: boolean;
  /** Server follow leader (server boards only): the task this
   * one follows, so the detail panel can show and change it. */
  followsTaskId?: string;
  followsTitle?: string;
  blocks?: Block[];
  /** Server task id (server boards only): the key for API calls. */
  id?: string;
  /** Server `position` (vertical order inside a day): carried
   * locally so a drag can diff it and persist a new lane order. */
  position?: number;
};

export type PlannerBoardTask = PlannerTaskData & {
  day: number;
  span?: number;
  lane?: number;
};

export type PlannerBoardMember = {
  name: string;
  role: string;
  pm?: boolean;
  tasks: PlannerBoardTask[];
  /** Server user id (server boards only): the key for API calls. */
  userId?: string;
};

export interface PlannerBoard {
  id: string;
  name: string;
  kind: "team" | "personal";
  /** Team boards only: the collaboration it belongs to. */
  collabName?: string;
  /** Team boards only: the collaboration's id (the board
   * key; the seeded boards predate it and fall back to the name). */
  collabId?: string;
  members: PlannerBoardMember[];
}



const seedBlock = (
  type: Block["type"],
  text: string,
  extra?: Partial<Block>,
): Block => ({ ...makeBlock(type, text), ...extra });

export const defaultBlocksFor = (title: string): Block[] => [
  seedBlock(
    "text",
    `Catatan untuk "${title}" masih kosong. Klik di sini dan mulai tulis, atau tekan / untuk menambah block.`,
  ),
  seedBlock("todo", "Langkah pertama"),
];

export function seedBoards(): PlannerBoard[] {
  // Seed boards removed (2026-11-27, production cleanup): the dummy
  // mockup boards (Underflow / LombaKampus / Portfolio) kept coming
  // back because load() fell back to these seeds whenever
  // localStorage was empty. Production starts with no boards;
  // real boards are created from collaborations or by the user.
  return [];
}

export function openTaskCount(board: PlannerBoard): number {
  return board.members.reduce(
    (sum, m) => sum + m.tasks.filter((tk) => !tk.done).length,
    0,
  );
}

// ---- Store ------------------------------------------------

const STORAGE_KEY = "uf-planner-boards-v1";
const SERVER_SEED = seedBoards();
let boards: PlannerBoard[] | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

// "Owner" is a board role (member 0 by construction), never
// a job role. Anything that reads or writes job roles must
// exclude it.
export const isReservedOwnerRole = (role: string): boolean =>
  role.trim().toLowerCase() === "owner";

// Seed member names were shortened ("Alvina Putri"); the board
// shows the profile name, so these restore the full name.
const FULL_NAMES: Record<string, string> = {
  "Faiz Aghitsna": "Faiz Atha Aghitsna",
  "Fadilah Yasin": "Fadilah Nur Yasin",
  "Alifah Syarifah": "Alifah Nailatusy Syarifah",
  "Alvina Putri": "Alvina Chalista Putri",
};

function load(): PlannerBoard[] {
  if (boards) return boards;
  let initial = seedBoards();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlannerBoard[];
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (b) => b && typeof b.id === "string" && Array.isArray(b.members),
        )
      ) {
        initial = parsed;
      }
    }
  } catch {
    // Corrupt or unavailable storage: fall back to the seeds.
  }
  // Drop the removed seed boards wherever they still sit
  // (2026-11-27): a browser that cached them in localStorage
  // keeps showing the dummy boards even after the seeds are
  // gone from the code. Filter them out once, on load.
  const REMOVED_SEED_IDS = new Set([
    "board-underflow",
    "board-lombakampus",
    "board-portfolio",
  ]);
  const beforeFilter = initial.length;
  initial = initial.filter((b) => !REMOVED_SEED_IDS.has(b.id));
  let repaired = initial.length !== beforeFilter;
  // One-time repair (2026-11-25): "Owner" leaked into job
  // roles (the portfolio seed and createBoard wrote it, and
  // the panel offered it as an option). A job role of
  // "Owner" is never valid: the board owner is member 0 by
  // construction. Restore the seed role by name, else empty.
  // Section keys are stripped too: the section field was
  // removed the same day, so saved tasks stop carrying it.
  const seeds = seedBoards();
  initial = initial.map((b) => {
    const seed = seeds.find((s) => s.id === b.id);
    const members = b.members.map((m) => {
      let next = m;
      if (m.tasks.some((tk) => "section" in tk)) {
        repaired = true;
        next = {
          ...m,
          tasks: m.tasks.map((tk) => {
            const clean = { ...tk } as PlannerBoardTask & {
              section?: string;
            };
            delete clean.section;
            return clean as PlannerBoardTask;
          }),
        };
      }
      const fullName = FULL_NAMES[next.name];
      if (fullName) {
        repaired = true;
        next = { ...next, name: fullName };
      }
      if (!isReservedOwnerRole(next.role)) return next;
      repaired = true;
      const seedRole = seed?.members.find(
        (sm) => sm.name === next.name,
      )?.role;
      return { ...next, role: seedRole ?? "" };
    });
    return { ...b, members };
  });
  boards = initial;
  boardsLoaded = true;
  if (repaired) persist();
  return boards;
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  } catch {
    // Storage full or blocked: the in-memory store still works.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!boards) {
    load();
    emit();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useBoards(): PlannerBoard[] {
  return useSyncExternalStore(
    subscribe,
    () => boards ?? SERVER_SEED,
    () => SERVER_SEED,
  );
}

let boardsLoaded = false;

export function useBoardsLoaded(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => boardsLoaded,
    () => false,
  );
}

export function deleteBoard(id: string): void {
  if (!boards) return;
  boards = boards.filter((b) => b.id !== id);
  persist();
  emit();
}

export function updateBoardMembers(
  id: string,
  members: PlannerBoardMember[],
): void {
  if (!boards) return;
  const idx = boards.findIndex((b) => b.id === id);
  if (idx < 0 || boards[idx].members === members) return;
  boards = boards.map((b, i) => (i === idx ? { ...b, members } : b));
  persist();
  emit();
}

export function createBoard(input: {
  kind: "team" | "personal";
  collabName?: string;
  collabId?: string;
  name?: string;
  ownerName: string;
}): PlannerBoard {
  const current = load();
  const board: PlannerBoard = {
    id: `board-${Date.now().toString(36)}`,
    name:
      input.kind === "team"
        ? (input.collabName ?? "Team board")
        : input.name?.trim() || "Personal board",
    kind: input.kind,
    collabName: input.kind === "team" ? input.collabName : undefined,
    collabId: input.kind === "team" ? input.collabId : undefined,
    members: [{ name: input.ownerName, role: "", tasks: [] }],
  };
  boards = [...current, board];
  persist();
  emit();
  return board;
}

// ---- Server team boards -------------------------------------------
// Team boards whose data lives on the server (GET /api/me/planners).
// A server board's id is `team-<collabId>` — deterministic, so the
// owner and every collaborator open the same URL. Seeded and
// personal boards stay in the local store above.

export const teamBoardId = (collabId: string): string => `team-${collabId}`;

export const collabIdFromTeamBoard = (boardId: string): string | null =>
  boardId.startsWith("team-") ? boardId.slice("team-".length) : null;

export interface ServerTeamBoard {
  id: string;
  name: string;
  collabId: string;
  openCount: number;
}

let serverTeamBoards: ServerTeamBoard[] | null = null;
let serverTeamBoardsLoaded = false;
let serverTeamBoardsInflight: Promise<ServerTeamBoard[]> | null = null;
const serverTeamBoardsListeners = new Set<() => void>();
// Stable empty list: useSyncExternalStore requires getSnapshot to
// return the same reference while nothing changed — a fresh []
// on every call makes React loop forever.
const EMPTY_SERVER_BOARDS: ServerTeamBoard[] = [];

function emitServerTeamBoards(): void {
  serverTeamBoardsListeners.forEach((l) => l());
}

export async function refreshServerTeamBoards(): Promise<void> {
  if (serverTeamBoardsInflight) {
    await serverTeamBoardsInflight;
    return;
  }
  const p = getMyPlanners()
    .then((list) => {
      serverTeamBoards = list.map((b) => ({
        id: teamBoardId(b.collabId),
        name: b.title,
        collabId: b.collabId,
        openCount: b.openCount,
      }));
      serverTeamBoardsLoaded = true;
      emitServerTeamBoards();
      return serverTeamBoards;
    })
    .catch(() => {
      // Backend down: keep the last known list (possibly empty).
      serverTeamBoardsLoaded = true;
      emitServerTeamBoards();
      return serverTeamBoards ?? [];
    })
    .finally(() => {
      serverTeamBoardsInflight = null;
    });
  serverTeamBoardsInflight = p;
  await p;
}

function subscribeServerTeamBoards(listener: () => void): () => void {
  serverTeamBoardsListeners.add(listener);
  if (!serverTeamBoardsLoaded) {
    void refreshServerTeamBoards();
  }
  return () => {
    serverTeamBoardsListeners.delete(listener);
  };
}

export function useServerTeamBoards(): ServerTeamBoard[] {
  return useSyncExternalStore(
    subscribeServerTeamBoards,
    () => serverTeamBoards ?? EMPTY_SERVER_BOARDS,
    () => EMPTY_SERVER_BOARDS,
  );
}

export function useServerTeamBoardsLoaded(): boolean {
  return useSyncExternalStore(
    subscribeServerTeamBoards,
    () => serverTeamBoardsLoaded,
    () => false,
  );
}

// ---- Create-board dialog visibility -----------------------
// Opened from the sidebar's New board row and from the board
// page's board switcher; the dialog itself is rendered once
// by the sidebar.

let createOpen = false;
const createListeners = new Set<() => void>();

export function setCreateBoardOpen(next: boolean): void {
  if (createOpen === next) return;
  createOpen = next;
  createListeners.forEach((listener) => listener());
}

export function useCreateBoardOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      createListeners.add(listener);
      return () => {
        createListeners.delete(listener);
      };
    },
    () => createOpen,
    () => false,
  );
}