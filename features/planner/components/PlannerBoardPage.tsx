"use client";

// features/planner/components/PlannerBoardPage.tsx
// UI-first canvas for the Tasks page, following the FigCraft design
// pass (Talmo-style planner board). All data below is SAMPLE data so
// the layout can be judged and directed first. Pills can be picked
// up and dragged to another day, or stretched by their edges,
// against LOCAL state only — wiring the moves to the planner API
// and the task dialog comes later. Do not hook this up to the
// backend yet.
//
// The drag rules mirror the real planner permissions: the owner
// and PMs move anyone's tasks, a member only their own, done tasks
// never move, and past days reject drops. Rows are dynamic: a drop
// that lands on an occupied lane opens the nearest free lane and
// empty lanes collapse, so a row grows and shrinks with its tasks.
// Lane placement follows gravity: a pill always occupies the
// lowest lane free for its span, so nothing ever floats with
// empty space above it. A small "view as" preview in the filter
// row stands in for the signed-in user while this page runs on
// sample data. Clicking a pill (a press that does not turn into
// a drag) opens its Notion-style detail panel from the right.
// The panel is half the viewport wide and hosts a Notion-style
// block body (BlockBody.tsx) under its properties.
// Commits animate: pills pushed by gravity or an insert glide
// to their new day/lane, row heights ease open and closed, and
// the background row lines and Who cells follow the same curve,
// so a drop reads as one continuous rearrangement.
//
// Board structure mirrors the reference: the grid is a BACKGROUND
// layer (continuous vertical lines, weekend bands, today's band and
// start line), and pills are positioned freely on top of it — a pill
// can span several day columns and crosses the lines, it is not
// boxed into a cell. The board shows a FULL MONTH and pans sideways
// like a canvas: grab it and drag (the cursor turns into a hand).
// The Who column is the board's sticky sidebar, and there is no
// visible scrollbar at all — the native one is hidden.

import { useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

import { BlockBody, makeBlock } from "./BlockBody";
import {
  defaultBlocksFor,
  deleteBoard,
  isReservedOwnerRole,
  setCreateBoardOpen,
  updateBoardMembers,
  useBoards,
  useBoardsLoaded,
} from "../boards";
import type {
  PlannerBoard,
  PlannerBoardMember,
  PlannerBoardTask,
  PlannerTaskData,
} from "../boards";
import { isCollabCompleted, useOwnedCollabs } from "../collab-status";
import type { Block } from "./BlockBody";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { DateField } from "@/components/ui/DateField";
import { useSessionUser } from "@/features/auth/store";
import { getCollabProjectAuthed } from "@/features/collaborations/api";
import type { CollabMember } from "@/features/collaborations/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// Sample month: November 2026 (Nov 1 is a Sunday). "Today" is
// Tue 17, mirroring the FigCraft reference.
const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SAMPLE_DAYS = Array.from({ length: 30 }, (_, i) => ({
  dow: DOWS[i % 7],
  date: i + 1,
  weekend: i % 7 === 0 || i % 7 === 6,
}));
const SAMPLE_TODAY = 17;
const TODAY_INDEX = SAMPLE_TODAY - 1;

// The board's month is November 2026; its date fields speak
// ISO dates at the boundary and day indices inside. The
// DateField calendar is told the board's "today" so its
// past-day disabling matches the board's past zone; once the
// board runs on real data the override can go away.
const BOARD_TODAY = new Date(2026, 10, SAMPLE_TODAY);
const isoForDay = (day: number) =>
  `2026-11-${String(day + 1).padStart(2, "0")}`;
const clampDayForIso = (iso: string): { day: number; clamped: boolean } => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return { day: TODAY_INDEX, clamped: true };
  const picked = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const first = new Date(2026, 10, 1);
  const last = new Date(2026, 10, SAMPLE_DAYS.length);
  if (picked < first) return { day: 0, clamped: true };
  if (picked > last) return { day: SAMPLE_DAYS.length - 1, clamped: true };
  return { day: Number(m[3]) - 1, clamped: false };
};

// Icons a task pill can carry, chosen from the detail panel.
// Names are Boxicons glyphs, rendered by the Icon component.
const TASK_ICONS = [
  "task",
  "code-alt",
  "palette",
  "search",
  "wrench",
  "server",
  "bug",
  "rocket",
  "layout",
  "data",
  "cloud",
  "file",
  "image",
  "link",
  "cog",
  "book",
];
// The board opens on the week of "today": Monday Nov 16.
const OPEN_SCROLL_DAYS = 15;

// Who column width (px), one day column (px), and one pill lane
// (px). Pills are 44px tall (h-11) with 4px of air in a lane.
const WHO_W = 220;
const DAY_W = 132;
const LANE_H = 52;
const BOARD_W = WHO_W + SAMPLE_DAYS.length * DAY_W;

// Board data shapes live in the boards store (../boards);
// these aliases keep the canvas's local naming.
type SampleTask = PlannerTaskData;
type BoardTask = PlannerBoardTask;

// One pill in flight: deltas are px from its home position.
type DragState = {
  member: number;
  title: string;
  kind: "move" | "resize-l" | "resize-r";
  dx: number;
  dy: number;
  active: boolean;
  settling: boolean;
  invalid: boolean;
};

// Lane placement combines the user's two rules. GRAVITY: a pill
// can never float with empty space above it — after every change
// each pill settles into the lowest lane free for its whole span.
// INTENT: where the user drops a pill vertically still matters —
// dropping onto an occupied lane inserts the pill there and
// shifts the stack down, so pills can be reordered up and down
// inside a stack; the gravity pass afterwards only removes
// floats, it never undoes the chosen order (in a stack every lane
// above is genuinely occupied, so nothing can rise).
function gravityPass(tasks: BoardTask[]): BoardTask[] {
  const ordered = [...tasks].sort(
    (a, b) => (a.lane ?? 0) - (b.lane ?? 0) || a.day - b.day,
  );
  const placed: BoardTask[] = [];
  for (const tk of ordered) {
    let lane = 0;
    while (
      placed.some(
        (o) =>
          (o.lane ?? 0) === lane &&
          tk.day < o.day + (o.span ?? 1) &&
          o.day < tk.day + (tk.span ?? 1),
      )
    ) {
      lane++;
    }
    placed.push({ ...tk, lane });
  }
  const byTitle = new Map(placed.map((tk) => [tk.title, tk]));
  return tasks.map((tk) => byTitle.get(tk.title) ?? tk);
}

// Push same-lane overlaps downward until the row is clean again
// (an insert shift can land a pill on a lane another pill holds).
function resolveOverlaps(tasks: BoardTask[]): BoardTask[] {
  const next = tasks.map((tk) => ({ ...tk }));
  for (let guard = 0; guard < 64; guard++) {
    let pushed = false;
    const ordered = [...next].sort(
      (a, b) => (a.lane ?? 0) - (b.lane ?? 0) || a.day - b.day,
    );
    for (let i = 0; i < ordered.length && !pushed; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const a = ordered[i];
        const b = ordered[j];
        if (
          (a.lane ?? 0) === (b.lane ?? 0) &&
          a.day < b.day + (b.span ?? 1) &&
          b.day < a.day + (a.span ?? 1)
        ) {
          const target = next.find((tk) => tk.title === b.title);
          if (target) target.lane = (target.lane ?? 0) + 1;
          pushed = true;
          break;
        }
      }
    }
    if (!pushed) break;
  }
  return next;
}

// Place the moved pill at the day and lane the user dropped it
// on: free lane → take it; occupied lane → insert and shift the
// overlapping stack down; then gravity settles the whole row.
function placeWithIntent(
  tasks: BoardTask[],
  title: string,
  day: number,
  dropLane: number,
): BoardTask[] {
  const moved = tasks.find((tk) => tk.title === title);
  if (!moved) return tasks;
  const span = moved.span ?? 1;
  const movedNext: BoardTask = { ...moved, day };
  let others = gravityPass(tasks.filter((tk) => tk.title !== title));
  const hitsAt = (list: BoardTask[], tk: BoardTask, lane: number) =>
    list.some(
      (o) =>
        (o.lane ?? 0) === lane &&
        tk.day < o.day + (o.span ?? 1) &&
        o.day < tk.day + (tk.span ?? 1),
    );
  if (hitsAt(others, movedNext, dropLane)) {
    others = resolveOverlaps(
      others.map((o) =>
        (o.lane ?? 0) >= dropLane &&
        movedNext.day < o.day + (o.span ?? 1) &&
        o.day < movedNext.day + span
          ? { ...o, lane: (o.lane ?? 0) + 1 }
          : o,
      ),
    );
  }
  return gravityPass([...others, { ...movedNext, lane: dropLane }]);
}

const dayLabel = (day: number, span: number) =>
  span > 1 ? `${day + 1}–${day + span} Nov` : `${day + 1} Nov`;

// Sample follower pairing shown in the detail panel (the real
// wiring reads the relation from the planner API later).
const SAMPLE_FOLLOWS: Record<string, string> = {
  "Implementasi board": "Review PR backend",
};



// Sample-phase stand-in for the signed-in user: who is looking at
// the board decides whose pills may move.
// Job roles: the world''s occupations, fetched live from the
// public corpora dataset (976 titles) and cached for the
// page lifetime. Board-local roles always come first; if
// the fetch fails the panel falls back to local roles only.
const OCCUPATIONS_URL =
  "https://raw.githubusercontent.com/dariusk/corpora/master/data/humans/occupations.json";
let occupationsPromise: Promise<string[]> | null = null;
function loadOccupations(): Promise<string[]> {
  if (!occupationsPromise) {
    occupationsPromise = fetch(OCCUPATIONS_URL)
      .then((r) => {
        if (!r.ok) throw new Error("occupations fetch failed");
        return r.json();
      })
      .then((d: { occupations?: unknown }) => {
        const list = Array.isArray(d.occupations) ? d.occupations : [];
        return list.filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        );
      })
      .catch(() => {
        occupationsPromise = null;
        return [];
      });
  }
  return occupationsPromise;
}
const toTitleCase = (s: string) =>
  s
    .split(/\s+/)
    .map((w) =>
      w === w.toUpperCase()
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");

const PERSONAS = [
  { key: "owner", member: 0 },
  { key: "pm", member: 1 },
  { key: "member", member: 3 },
] as const;
type ViewerKey = (typeof PERSONAS)[number]["key"];

type SampleMember = PlannerBoardMember;



// Row geometry for the background layer: header height + each
// member row's height (lanes * LANE_H). The horizontal separators
// live in the background layer with the column lines, so the past
// days wash covers them exactly like it covers the column lines.
// Heights are recomputed from the live task state on every render:
// rows are dynamic and follow their tasks.
const HEADER_H = 48;

function SamplePill({
  task,
  className = "",
  style,
  onPointerDown,
  onResizeDown,
}: {
  task: SampleTask;
  className?: string;
  style?: CSSProperties;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onResizeDown?: (
    edge: "l" | "r",
    e: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}) {
  return (
    <div
      style={style}
      onPointerDown={onPointerDown}
      className={`flex items-center gap-2 rounded-full px-3.5 ${
        task.done
          ? "bg-active text-ink/70"
          : task.pencilled
            ? "border border-line bg-surface text-ink/85"
            : "bg-ink text-surface"
      } ${className}`}
    >
      <span className="shrink-0 opacity-90">
        <Icon name={task.done ? "check" : (task.icon ?? "edit")} size={13} />
      </span>
      <span
        className={`truncate text-[11px] font-semibold leading-tight ${
          task.done ? "line-through" : ""
        }`}
      >
        {task.title}
      </span>
      {onResizeDown && (
        <>
          <div
            aria-hidden
            onPointerDown={(e) => onResizeDown("l", e)}
            className="absolute inset-y-0 left-0 z-20 w-3.5 cursor-ew-resize rounded-l-full"
          />
          <div
            aria-hidden
            onPointerDown={(e) => onResizeDown("r", e)}
            className="absolute inset-y-0 right-0 z-20 w-3.5 cursor-ew-resize rounded-r-full"
          />
        </>
      )}
    </div>
  );
}

// A select that renders its options as an Astryx-style menu
// instead of the browser's native dropdown, so option lists
// inside dialogs and the detail panel match the design
// system: surface card, line border, 12px radius, a check on
// the current value, and a scroll cap for long lists (dates).
function MenuSelect({
  value,
  options,
  onChange,
  disabled,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink hover:bg-active disabled:opacity-50"
      >
        <span className="truncate">{current?.label ?? ""}</span>
        <Icon name="chevron-down" size={12} />
      </button>
      {open && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-2xl">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm whitespace-nowrap text-ink hover:bg-active"
              >
                {o.label}
                {o.value === value && <Icon name="check" size={13} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// One Notion-style property row in the task detail panel: an
// icon + muted label column, the value beside it.
function DetailRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex w-36 shrink-0 items-center gap-2 text-sm text-muted">
        <Icon name={icon} size={15} />
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2 text-sm text-ink">
        {children}
      </div>
    </div>
  );
}

export function PlannerBoardPage({ boardId }: { boardId: string }) {
  const { t } = useLanguage();
  const boards = useBoards();
  const loaded = useBoardsLoaded();
  const board = boards.find((b) => b.id === boardId);
  const { list: ownedCollabs } = useOwnedCollabs();
  const boardDone =
    board !== undefined &&
    board.kind === "team" &&
    isCollabCompleted(ownedCollabs, board.collabId, board.collabName);
  if (!loaded) return null;
  if (!board) {
    return (
      <div className="flex flex-col items-start gap-3 py-16">
        <h1 className="text-2xl font-medium tracking-tight text-ink">
          {t("planner.boardNotFound")}
        </h1>
        <p className="max-w-md text-sm text-muted">
          {t("planner.boardNotFoundBody")}
        </p>
        <Link
          href="/tasks"
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink"
        >
          {t("planner.backToTasks")}
        </Link>
      </div>
    );
  }
  // The board's data stays in the store; the board itself is
  // hidden while its collaboration is completed, and returns
  // when the collab is reopened.
  if (boardDone) {
    return (
      <div className="flex flex-col items-start gap-3 py-16">
        <h1 className="text-2xl font-medium tracking-tight text-ink">
          {t("planner.boardCompleted")}
        </h1>
        <p className="max-w-md text-sm text-muted">
          {t("planner.boardCompletedBody")}
        </p>
        <Link
          href="/tasks"
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink"
        >
          {t("planner.backToTasks")}
        </Link>
      </div>
    );
  }
  return (
    <BoardCanvas
      key={board.id}
      board={board}
      onMembersChange={(ms) => updateBoardMembers(board.id, ms)}
    />
  );
}

function BoardCanvas({
  board,
  onMembersChange,
}: {
  board: PlannerBoard;
  onMembersChange: (members: SampleMember[]) => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const boards = useBoards();
  const { list: ownedCollabs } = useOwnedCollabs();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{
    startX: number;
    startScroll: number;
    lastX: number;
    lastT: number;
    velocity: number; // px per ms, in scroll space
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);
  const [panning, setPanning] = useState(false);
  const [members, setMembers] = useState<SampleMember[]>(() =>
    board.members.map((m) => ({
      ...m,
      tasks: m.tasks.map((tk) => ({ ...tk })),
    })),
  );
  const sessionUser = useSessionUser();
  // The real collab roster (names + profile photos) for team
  // boards, fetched once from the collab detail. Seeded boards
  // predate collabId, so the id resolves through the owned
  // collabs list by title; a failed or missing fetch just
  // leaves the stored names and initial avatars in place.
  // (ownedCollabs is already subscribed above, for the
  // board switcher.)
  const collabId =
    board.kind === "team"
      ? (board.collabId ??
        ownedCollabs?.find((c) => c.title === board.collabName)?.id)
      : undefined;
  const [collabMembers, setCollabMembers] = useState<
    CollabMember[] | null
  >(null);
  useEffect(() => {
    if (!collabId) return;
    let cancelled = false;
    getCollabProjectAuthed(collabId)
      .then((project) => {
        if (!cancelled && project) setCollabMembers(project.members);
      })
      .catch(() => {
        // Backend down or unknown collab: keep initials.
      });
    return () => {
      cancelled = true;
    };
  }, [collabId]);
  // A member who joins the collab after the board was made never
  // got a row: the board only ever held the members it was created
  // with. Once the real roster loads, append every collab member
  // the board does not know yet (empty lane, no role yet) so they
  // can be assigned tasks. Rows are only ever added, never
  // removed: removing a row would delete its tasks.
  useEffect(() => {
    if (!collabMembers) return;
    setMembers((prev) => {
      const known = new Set(prev.map((m) => m.name.toLowerCase()));
      const missing = collabMembers.filter(
        (cm) => cm.name !== "" && !known.has(cm.name.toLowerCase()),
      );
      if (missing.length === 0) return prev;
      return [
        ...prev,
        ...missing.map((cm) => ({
          name: cm.name,
          role: "",
          tasks: [],
        })),
      ];
    });
  }, [collabMembers]);

  // Member 0 is the board owner, i.e. the signed-in user: the
  // name and photo shown for that row come from their profile
  // (AuthUser.name = editable full_name, username fallback;
  // AuthUser.photo), never from the stored seed values. Other
  // members resolve against the collab roster by profile name.
  const collabMemberFor = (mi: number): CollabMember | undefined => {
    const name = members[mi]?.name;
    if (!name || !collabMembers) return undefined;
    return collabMembers.find(
      (cm) => cm.name.toLowerCase() === name.toLowerCase(),
    );
  };
  const displayName = (mi: number): string => {
    if (mi === 0 && sessionUser?.name) return sessionUser.name;
    return collabMemberFor(mi)?.name ?? members[mi].name;
  };
  const photoFor = (mi: number): string | undefined => {
    if (mi === 0) return sessionUser?.photo;
    return collabMemberFor(mi)?.avatarUrl;
  };
  // Every edit flows back to the boards store, so the sidebar
  // counts and the next visit to this board see the same state.
  useEffect(() => {
    onMembersChange(members);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  // Role picker lives in the member panel now (same Side
  // Peek pattern as the task detail). Member 0 is the board
  // owner (PERSONAS convention) and is never changeable;
  // personal boards have no board role.
  const setMemberRole = (mi: number, pm: boolean) => {
    const member = members[mi];
    if (!member) return;
    if (member.pm === pm) return;
    setMembers((prev) =>
      prev.map((m, i) => (i === mi ? { ...m, pm } : m)),
    );
    showToast(
      "ok",
      t(pm ? "planner.madePm" : "planner.removedPm", {
        name: displayName(mi),
      }),
    );
  };
  const [drag, setDrag] = useState<DragState | null>(null);
  // The pill whose drop just committed: its own left/top must
  // not animate in the commit render (its settle glide already
  // carried it there), while every OTHER pill glides to its new
  // day/lane. Cleared again on the next frame.
  const [settleKey, setSettleKey] = useState<string | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const pendingCommitRef = useRef<(() => void) | null>(null);
  const [viewerKey] = useState<ViewerKey>("owner");
  const viewer = PERSONAS.find((p) => p.key === viewerKey) ?? PERSONAS[0];
  const [toast, setToast] = useState<{
    id: number;
    kind: "ok" | "warn";
    text: string;
    leaving: boolean;
  } | null>(null);
  const toastTimersRef = useRef<number[]>([]);

  const clearToastTimers = () => {
    toastTimersRef.current.forEach((id) => window.clearTimeout(id));
    toastTimersRef.current = [];
  };

  // Toast lifecycle: glide in (decelerating), hold, then glide
  // back out along the same path (accelerating) before it
  // unmounts — never a hard cut in either direction.
  const showToast = (kind: "ok" | "warn", text: string) => {
    clearToastTimers();
    const id = Date.now();
    setToast({ id, kind, text, leaving: false });
    toastTimersRef.current.push(
      window.setTimeout(() => {
        setToast((prev) =>
          prev && prev.id === id ? { ...prev, leaving: true } : prev,
        );
      }, 3000),
      window.setTimeout(() => {
        setToast((prev) => (prev && prev.id === id ? null : prev));
      }, 3260),
    );
  };

  // Who may move a pill: done tasks never move; a task whose
  // last day has passed is locked in place (its dates can still
  // be rescued from the detail panel); a member moves only
  // their own; the owner and PMs move anyone's.
  const dragGate = (
    mi: number,
    task: BoardTask,
  ): "done" | "past" | "own" | null => {
    if (task.done) return "done";
    if (task.day + (task.span ?? 1) - 1 < TODAY_INDEX) return "past";
    if (viewer.key === "member" && viewer.member !== mi) return "own";
    return null;
  };
  const gateToast = (gate: "done" | "past" | "own") =>
    showToast(
      "warn",
      t(
        gate === "done"
          ? "planner.toastDone"
          : gate === "past"
            ? "planner.toastPastLocked"
            : "planner.toastOwnOnly",
      ),
    );

  // Task detail panel (Notion-style, slides in from the right).
  const [detail, setDetail] = useState<{ member: number; title: string } | null>(
    null,
  );
  const [detailLeaving, setDetailLeaving] = useState(false);
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const detailTimerRef = useRef<number | null>(null);
  const openDetail = (member: number, title: string) => {
    if (detailTimerRef.current) window.clearTimeout(detailTimerRef.current);
    setDetailLeaving(false);
    setIconMenuOpen(false);
    setConfirmDelete(false);
    setDetail({ member, title });
  };
  const closeDetail = () => {
    setDetailLeaving(true);
    if (detailTimerRef.current) window.clearTimeout(detailTimerRef.current);
    detailTimerRef.current = window.setTimeout(() => {
      setDetail(null);
      setDetailLeaving(false);
    }, 250);
  };

  // Member panel: slides in from the right when a Who row
  // is clicked; same Side Peek pattern as the task detail.
  const [memberPanel, setMemberPanel] = useState<number | null>(null);
  const [memberLeaving, setMemberLeaving] = useState(false);
  const [roleDraft, setRoleDraft] = useState("");
  const [apiRoles, setApiRoles] = useState<string[] | null>(null);
  const memberTimerRef = useRef<number | null>(null);
  const rowDownRef = useRef<{ x: number; y: number } | null>(null);
  const openMemberPanel = (mi: number) => {
    if (memberTimerRef.current) window.clearTimeout(memberTimerRef.current);
    setMemberLeaving(false);
    setRoleDraft(members[mi]?.role ?? "");
    if (apiRoles === null) {
      loadOccupations().then((list) => setApiRoles(list.map(toTitleCase)));
    }
    setMemberPanel(mi);
  };
  const closeMemberPanel = () => {
    setMemberLeaving(true);
    if (memberTimerRef.current) window.clearTimeout(memberTimerRef.current);
    memberTimerRef.current = window.setTimeout(() => {
      setMemberPanel(null);
      setMemberLeaving(false);
    }, 250);
  };
  const commitJobRole = (role: string) => {
    if (memberPanel === null) return;
    const trimmed = toTitleCase(role.trim());
    const member = members[memberPanel];
    if (!member || trimmed === "" || trimmed === member.role) return;
    if (isReservedOwnerRole(trimmed)) {
      showToast("warn", t("planner.toastOwnerNotJob"));
      return;
    }
    setMembers((prev) =>
      prev.map((m, i) => (i === memberPanel ? { ...m, role: trimmed } : m)),
    );
    showToast(
      "ok",
      t("planner.roleSetTo", { name: displayName(memberPanel), role: trimmed }),
    );
  };

  // Add task dialog. The board is dynamic now: a new pill is
  // created in state, lands on the chosen member's row, and
  // gravity assigns its lane. A member viewer only ever adds
  // to their own row; the owner and PMs may assign anyone.
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addMember, setAddMember] = useState(0);
  const [addStart, setAddStart] = useState(TODAY_INDEX);
  const [addEnd, setAddEnd] = useState(TODAY_INDEX);
  const openAdd = () => {
    setAddTitle("");
    setAddMember(viewer.key === "member" ? viewer.member : 0);
    setAddStart(TODAY_INDEX);
    setAddEnd(TODAY_INDEX);
    setAddOpen(true);
  };
  const submitAdd = () => {
    const title = addTitle.trim();
    if (!title) {
      showToast("warn", t("planner.toastNeedTitle"));
      return;
    }
    const target = viewer.key === "member" ? viewer.member : addMember;
    if (members[target].tasks.some((tk) => tk.title === title)) {
      showToast("warn", t("planner.toastDupTitle"));
      return;
    }
    const task: BoardTask = {
      title,
      day: addStart,
      span: addEnd - addStart + 1,
      blocks: defaultBlocksFor(title),
    };
    setMembers((prev) =>
      prev.map((m, i) =>
        i === target ? { ...m, tasks: gravityPass([...m.tasks, task]) } : m,
      ),
    );
    setAddOpen(false);
    showToast("ok", t("planner.toastAdded"));
    openDetail(target, title);
  };

  const setDetailIcon = (icon: string) => {
    if (!detail) return;
    setMembers((prev) =>
      prev.map((m, i) =>
        i !== detail.member
          ? m
          : {
              ...m,
              tasks: m.tasks.map((tk) =>
                tk.title === detail.title ? { ...tk, icon } : tk,
              ),
            },
      ),
    );
    setIconMenuOpen(false);
    showToast("ok", t("planner.taskUpdated"));
  };

  // Delete follows the same gate as editing: the owner and
  // PMs may delete anyone's task, a member only their own
  // (the button is not rendered at all otherwise).
  const deleteDetailTask = () => {
    if (!detail) return;
    const targetMember = detail.member;
    const targetTitle = detail.title;
    setMembers((prev) =>
      prev.map((m, i) =>
        i !== targetMember
          ? m
          : {
              ...m,
              tasks: gravityPass(
                m.tasks.filter((tk) => tk.title !== targetTitle),
              ),
            },
      ),
    );
    setConfirmDelete(false);
    closeDetail();
    showToast("ok", t("planner.taskDeleted"));
  };

  // Due-date picks come back as ISO dates; anything outside
  // the board's month clamps to its nearest edge with a note.
  const pickDay = (iso: string): number => {
    const { day, clamped } = clampDayForIso(iso);
    if (clamped) showToast("warn", t("planner.toastDateRange"));
    return day;
  };

  // A grab during another pill's glide home commits that move
  // instantly, so the new drag starts from rest.
  const flushPending = () => {
    if (pendingCommitRef.current) {
      pendingCommitRef.current();
      pendingCommitRef.current = null;
    }
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  // Dynamic row geometry, recomputed from the live tasks.
  const rowHeights = members.map(
    (m) => Math.max(1, ...m.tasks.map((tk) => (tk.lane ?? 0) + 1)) * LANE_H,
  );
  const rowBoundaries = rowHeights.map(
    (_, i) => HEADER_H + rowHeights.slice(0, i).reduce((a, b) => a + b, 0),
  );

  // Open on the week of "today" (Monday Nov 16).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = OPEN_SCROLL_DAYS * DAY_W;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (momentumRef.current) cancelAnimationFrame(momentumRef.current);
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      clearToastTimers();
      if (detailTimerRef.current) window.clearTimeout(detailTimerRef.current);
      if (memberTimerRef.current) window.clearTimeout(memberTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  useEffect(() => {
    if (memberPanel === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMemberPanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [memberPanel]);

  useEffect(() => {
    if (!addOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen]);

  useEffect(() => {
    if (!confirmDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmDelete(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDelete]);

  useEffect(() => {
    if (!settleKey) return;
    const raf = requestAnimationFrame(() => setSettleKey(null));
    return () => cancelAnimationFrame(raf);
  }, [settleKey]);

  const stopMomentum = () => {
    if (momentumRef.current) cancelAnimationFrame(momentumRef.current);
    momentumRef.current = null;
  };

  const toggleDetailDone = () => {
    if (!detail) return;
    setMembers((prev) =>
      prev.map((m, i) =>
        i !== detail.member
          ? m
          : {
              ...m,
              tasks: m.tasks.map((tk) =>
                tk.title === detail.title
                  ? { ...tk, done: !tk.done, overdue: false }
                  : tk,
              ),
            },
      ),
    );
    showToast("ok", t("planner.taskUpdated"));
  };


  const changeDetailDay = (newDay: number) => {
    if (!detail) return;
    const task = members[detail.member]?.tasks.find(
      (tk) => tk.title === detail.title,
    );
    if (!task) return;
    const span = Math.min(task.span ?? 1, SAMPLE_DAYS.length - newDay);
    setMembers((prev) =>
      prev.map((m, i) =>
        i !== detail.member
          ? m
          : {
              ...m,
              tasks: gravityPass(
                m.tasks.map((tk) =>
                  tk.title === detail.title ? { ...tk, day: newDay, span } : tk,
                ),
              ),
            },
      ),
    );
    showToast(
      "ok",
      `${t("planner.dateMoved")} · "${detail.title}" → ${dayLabel(newDay, span)}`,
    );
  };

  const changeDetailSpan = (newSpan: number) => {
    if (!detail) return;
    const task = members[detail.member]?.tasks.find(
      (tk) => tk.title === detail.title,
    );
    if (!task) return;
    setMembers((prev) =>
      prev.map((m, i) =>
        i !== detail.member
          ? m
          : {
              ...m,
              tasks: gravityPass(
                m.tasks.map((tk) =>
                  tk.title === detail.title ? { ...tk, span: newSpan } : tk,
                ),
              ),
            },
      ),
    );
    showToast(
      "ok",
      `${t("planner.dateMoved")} · "${detail.title}" → ${dayLabel(task.day, newSpan)}`,
    );
  };

  const updateDetailBlocks = (blocks: Block[]) => {
    if (!detail) return;
    setMembers((prev) =>
      prev.map((m, i) =>
        i !== detail.member
          ? m
          : {
              ...m,
              tasks: m.tasks.map((tk) =>
                tk.title === detail.title ? { ...tk, blocks } : tk,
              ),
            },
      ),
    );
  };

  const scrollToTodayWeek = () => {
    stopMomentum();
    scrollRef.current?.scrollTo({
      left: OPEN_SCROLL_DAYS * DAY_W,
      behavior: "smooth",
    });
  };

  // Canvas-style panning: press, hold and drag the board itself.
  // The drag is applied on animation frames so it tracks the
  // pointer at display rate, and releasing mid-flick lets the
  // board glide with decaying momentum, like the FigCraft canvas.
  const onPanDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0) return;
    // A press on the scroll container's own scrollbar (the strip
    // outside its client box) belongs to the native scrollbar drag.
    // Capturing it would hijack that drag and nothing would scroll.
    const rect = el.getBoundingClientRect();
    if (
      e.clientX > rect.left + el.clientLeft + el.clientWidth ||
      e.clientY > rect.top + el.clientTop + el.clientHeight
    ) {
      return;
    }
    stopMomentum();
    panRef.current = {
      startX: e.clientX,
      startScroll: el.scrollLeft,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    };
    setPanning(true);
    el.setPointerCapture(e.pointerId);
  };
  const onPanMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    const el = scrollRef.current;
    if (!pan || !el) return;
    const now = performance.now();
    const dt = now - pan.lastT;
    if (dt > 0) {
      pan.velocity = (pan.lastX - e.clientX) / dt;
      pan.lastX = e.clientX;
      pan.lastT = now;
    }
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const p = panRef.current;
      const el2 = scrollRef.current;
      if (!p || !el2) return;
      el2.scrollLeft = p.startScroll - (p.lastX - p.startX);
    });
  };
  const onPanEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    panRef.current = null;
    setPanning(false);
    const captured = scrollRef.current;
    if (captured) {
      try {
        if (captured.hasPointerCapture(e.pointerId)) {
          captured.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Pointer already gone; nothing to release.
      }
    }
    const el = scrollRef.current;
    if (!pan || !el) return;
    el.scrollLeft = pan.startScroll - (pan.lastX - pan.startX);
    let v = pan.velocity;
    if (Math.abs(v) < 0.05) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const before = el.scrollLeft;
      el.scrollLeft = before + v * dt;
      v *= Math.pow(0.5, dt / 160);
      if (Math.abs(v) < 0.02 || el.scrollLeft === before) {
        momentumRef.current = null;
        return;
      }
      momentumRef.current = requestAnimationFrame(step);
    };
    momentumRef.current = requestAnimationFrame(step);
  };

  // While a pill is held near the board's left or right edge,
  // the board scrolls underneath it (faster the deeper the
  // pointer pushes in) so the pill can travel to days outside
  // the current view. onScroll re-runs the drag math after every
  // step, because scrolling shifts the pill's board position
  // under a pointer that is standing still. Returns stop.
  const runEdgeScroll = (getX: () => number, onScroll: () => void) => {
    let raf = 0;
    const step = () => {
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const EDGE = 56;
      const x = getX();
      const leftLimit = rect.left + WHO_W + EDGE;
      const rightLimit = rect.right - EDGE;
      let v = 0;
      if (x < leftLimit) v = -Math.min(14, 2 + (leftLimit - x) / 6);
      else if (x > rightLimit) v = Math.min(14, 2 + (x - rightLimit) / 6);
      if (v !== 0) {
        el.scrollLeft += v;
        onScroll();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  };

  // Pill drag: press a pill and it lifts and follows the pointer
  // 1:1 (Pointer Events, the same system as the canvas pan — the
  // approach Jev picked). Horizontal movement reschedules within
  // the member's own row; vertical movement reorders lanes inside
  // that row (hard stop at its top edge, rubber band below).
  // Holding the pill near a board edge scrolls the board under
  // it. Releasing snaps to the nearest day column; a drop into
  // the gray past zone is rejected and the pill glides back.
  const onPillDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    mi: number,
    task: BoardTask,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    // The gate is enforced the moment a press turns into a drag
    // (in applyMove below); a plain click on any pill, gated or
    // not, just opens its detail panel.
    const gate = dragGate(mi, task);
    stopMomentum();
    flushPending();
    const member = members[mi];
    const lanes = Math.max(1, ...member.tasks.map((tk) => (tk.lane ?? 0) + 1));
    const lane0 = task.lane ?? 0;
    const span = task.span ?? 1;
    const startX = e.clientX;
    const startY = e.clientY;
    const minDx = -(task.day * DAY_W + 6);
    const maxDx = (SAMPLE_DAYS.length - task.day - span) * DAY_W;
    // One lane of room below the last one: dropping there opens a
    // new lane and the row grows.
    const minDy = -lane0 * LANE_H;
    const maxDy = (lanes - lane0) * LANE_H;
    let live: DragState | null = null;
    let rejected = false;
    let stopEdgeFn: () => void = () => {};
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUpFalse);
      window.removeEventListener("pointercancel", onUpTrue);
      stopEdgeFn();
    };

    const judge = (dx: number, dy: number) => {
      const day = Math.round(task.day + dx / DAY_W);
      const lane = Math.min(
        lanes,
        Math.max(0, Math.round(lane0 + dy / LANE_H)),
      );
      return { day, lane, ok: day >= TODAY_INDEX };
    };
    let lastX = startX;
    let lastY = startY;
    const startScroll = scrollRef.current?.scrollLeft ?? 0;
    const applyMove = () => {
      if (rejected) return;
      const scrollComp = (scrollRef.current?.scrollLeft ?? 0) - startScroll;
      let dx = Math.min(maxDx, Math.max(minDx, lastX - startX + scrollComp));
      let dy = lastY - startY;
      // Hard stop at the row's top edge: a pill never spills over
      // the row above it. Downward overshoot keeps the rubber band.
      if (dy < minDy) dy = minDy;
      if (dy > maxDy) dy = maxDy + (dy - maxDy) * 0.35;
      if (!live) {
        if (Math.hypot(dx, dy) < 5) return;
        if (gate) {
          rejected = true;
          gateToast(gate);
          detach();
          return;
        }
      }
      const verdict = judge(dx, dy);
      live = {
        member: mi,
        title: task.title,
        kind: "move",
        dx,
        dy,
        active: true,
        settling: false,
        invalid: !verdict.ok,
      };
      setDrag({ ...live });
    };
    stopEdgeFn = runEdgeScroll(() => lastX, applyMove);
    const onMove = (ev: PointerEvent) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
      applyMove();
    };
    const onUp = (cancelled: boolean) => {
      detach();
      if (rejected) return;
      if (!live) {
        if (!cancelled) openDetail(mi, task.title);
        return;
      }
      const { dx, dy } = live;
      const verdict = judge(dx, dy);
      const intoPast = verdict.day < TODAY_INDEX;
      const valid = !cancelled && !intoPast;
      const resolved = valid
        ? placeWithIntent(member.tasks, task.title, verdict.day, verdict.lane)
        : null;
      const placed = resolved?.find((tk) => tk.title === task.title);
      const targetDx = placed ? (placed.day - task.day) * DAY_W : 0;
      const targetDy = placed ? ((placed.lane ?? 0) - lane0) * LANE_H : 0;
      setDrag({ ...live, dx: targetDx, dy: targetDy, settling: true });
      pendingCommitRef.current = () => {
        if (resolved && placed) {
          setSettleKey(`${mi}:${task.title}`);
          setMembers((prev) =>
            prev.map((m, i) => (i === mi ? { ...m, tasks: resolved } : m)),
          );
          if (placed.day !== task.day || (placed.lane ?? 0) !== lane0) {
            showToast(
              "ok",
              `${t("planner.dateMoved")} · "${task.title}" → ${dayLabel(placed.day, placed.span ?? 1)}`,
            );
          }
        } else if (!cancelled && intoPast) {
          showToast("warn", t("planner.toastPast"));
        }
        setDrag(null);
      };
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        const commit = pendingCommitRef.current;
        pendingCommitRef.current = null;
        commit?.();
      }, 200);
    };
    const onUpFalse = () => onUp(false);
    const onUpTrue = () => onUp(true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUpFalse);
    window.addEventListener("pointercancel", onUpTrue);
  };

  // Pill resize: drag the left or right edge (the cursor turns
  // into a left-right arrow over the edge handles). The right edge
  // changes the span; the left edge moves the start day and keeps
  // the end fixed. Same gate as moving. The span stops at the
  // neighbour in the same lane, at the month edges, and the start
  // can never cross into the past zone.
  const onResizeDown = (
    edge: "l" | "r",
    e: ReactPointerEvent<HTMLDivElement>,
    mi: number,
    task: BoardTask,
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const gate = dragGate(mi, task);
    if (gate) {
      gateToast(gate);
      return;
    }
    stopMomentum();
    flushPending();
    const member = members[mi];
    const lane0 = task.lane ?? 0;
    const span0 = task.span ?? 1;
    const startX = e.clientX;
    let minDx: number;
    let maxDx: number;
    if (edge === "r") {
      const nextStart = Math.min(
        SAMPLE_DAYS.length,
        ...member.tasks
          .filter(
            (o) =>
              o.title !== task.title && (o.lane ?? 0) === lane0 && o.day > task.day,
          )
          .map((o) => o.day),
      );
      minDx = -(span0 - 1) * DAY_W;
      maxDx = (nextStart - task.day - span0) * DAY_W;
    } else {
      const prevEnd = Math.max(
        TODAY_INDEX,
        ...member.tasks
          .filter(
            (o) =>
              o.title !== task.title &&
              (o.lane ?? 0) === lane0 &&
              o.day + (o.span ?? 1) <= task.day,
          )
          .map((o) => o.day + (o.span ?? 1)),
      );
      minDx = (prevEnd - task.day) * DAY_W;
      maxDx = (span0 - 1) * DAY_W;
    }
    let live: DragState | null = null;
    let lastX = startX;
    const startScroll = scrollRef.current?.scrollLeft ?? 0;
    const applyResize = () => {
      const scrollComp = (scrollRef.current?.scrollLeft ?? 0) - startScroll;
      const dx = Math.min(
        maxDx,
        Math.max(minDx, lastX - startX + scrollComp),
      );
      if (!live && Math.abs(dx) < 3) return;
      live = {
        member: mi,
        title: task.title,
        kind: edge === "l" ? "resize-l" : "resize-r",
        dx,
        dy: 0,
        active: true,
        settling: false,
        invalid: false,
      };
      setDrag({ ...live });
    };
    const stopEdge = runEdgeScroll(() => lastX, applyResize);
    const onMove = (ev: PointerEvent) => {
      lastX = ev.clientX;
      applyResize();
    };
    const onUp = (cancelled: boolean) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUpFalse);
      window.removeEventListener("pointercancel", onUpTrue);
      stopEdge();
      if (!live) return;
      const { dx } = live;
      let newDay = task.day;
      let newSpan = span0;
      if (!cancelled) {
        if (edge === "r") {
          newSpan = Math.min(
            span0 + Math.round(maxDx / DAY_W),
            Math.max(1, span0 + Math.round(dx / DAY_W)),
          );
        } else {
          newDay = Math.max(
            task.day + Math.round(minDx / DAY_W),
            Math.min(
              task.day + span0 - 1,
              task.day + Math.round(dx / DAY_W),
            ),
          );
          newSpan = task.day + span0 - newDay;
        }
      }
      const changed = newDay !== task.day || newSpan !== span0;
      const targetDx =
        edge === "r" ? (newSpan - span0) * DAY_W : (newDay - task.day) * DAY_W;
      setDrag({ ...live, dx: targetDx, settling: true });
      pendingCommitRef.current = () => {
        if (changed) {
          setSettleKey(`${mi}:${task.title}`);
          setMembers((prev) =>
            prev.map((m, i) =>
              i !== mi
                ? m
                : {
                    ...m,
                    tasks: gravityPass(
                      m.tasks.map((tk) =>
                        tk.title === task.title
                          ? { ...tk, day: newDay, span: newSpan }
                          : tk,
                      ),
                    ),
                  },
            ),
          );
          showToast(
            "ok",
            `${t("planner.toastResized")} · "${task.title}" → ${dayLabel(newDay, newSpan)}`,
          );
        }
        setDrag(null);
      };
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        const commit = pendingCommitRef.current;
        pendingCommitRef.current = null;
        commit?.();
      }, 150);
    };
    const onUpFalse = () => onUp(false);
    const onUpTrue = () => onUp(true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUpFalse);
    window.addEventListener("pointercancel", onUpTrue);
  };

  const detailMember = detail ? members[detail.member] : undefined;
  const panelMember =
    memberPanel !== null ? members[memberPanel] : undefined;
  const panelOpenCount = panelMember
    ? panelMember.tasks.filter((tk) => !tk.done).length
    : 0;
  const canEditRoles = viewer.key === "owner";
  const roleOptions = [
    ...new Set(boards.flatMap((b) => b.members.map((m) => m.role))),
  ].filter(Boolean);
  const draft = roleDraft.trim().toLowerCase();
  const combinedRoles = [
    ...roleOptions,
    ...(apiRoles ?? []).filter(
      (r) => !roleOptions.some((o) => o.toLowerCase() === r.toLowerCase()),
    ),
  ].filter((r) => !isReservedOwnerRole(r));
  const filteredRoles = combinedRoles
    .filter((r) => r.toLowerCase().includes(draft))
    .slice(0, 8);
  const detailTask = detailMember?.tasks.find(
    (tk) => tk.title === detail?.title,
  );
  const detailSpan = detailTask?.span ?? 1;
  const detailDateText = detailTask
    ? detailSpan > 1
      ? `${SAMPLE_DAYS[detailTask.day].dow} ${detailTask.day + 1} – ${SAMPLE_DAYS[detailTask.day + detailSpan - 1].dow} ${detailTask.day + detailSpan} Nov 2026`
      : `${SAMPLE_DAYS[detailTask.day].dow}, ${detailTask.day + 1} Nov 2026`
    : "";
  const detailCanEdit =
    detail != null &&
    (viewer.key !== "member" || viewer.member === detail.member);


  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-medium tracking-tight text-ink">
            {t("planner.title")}
          </h1>
          <p className="text-sm text-muted">
            {board.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSwitchOpen((v) => !v)}
              className="flex max-w-[240px] items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink"
            >
            <span className="truncate">{board.name}</span>
              <Icon name="chevron-down" size={14} />
            </button>
            {switchOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSwitchOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-2xl">
                  {boards
                    .filter(
                      (b) =>
                        b.kind !== "team" ||
                        !isCollabCompleted(
                          ownedCollabs,
                          b.collabId,
                          b.collabName,
                        ),
                    )
                    .map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSwitchOpen(false);
                        if (b.id !== board.id) {
                          router.push(`/tasks/${b.id}`);
                        }
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-active"
                    >
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${
                          b.id === board.id ? "bg-accent" : "bg-line"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {b.name}
                      </span>
                      <span className="text-xs text-muted">
                        {b.kind === "team"
                          ? t("planner.kindTeam")
                          : t("planner.kindPersonal")}
                      </span>
                      {b.id === board.id && (
                        <Icon
                          name="check"
                          size={16}
                          className="shrink-0 text-accent"
                        />
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchOpen(false);
                      setCreateBoardOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-ink hover:bg-active"
                  >
                    <Icon name="plus" size={15} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {t("nav.newBoard")}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface"
          >
            <Icon name="plus" size={14} />
            {t("planner.addTask")}
          </button>
          {viewer.key === "owner" && (
            <button
              type="button"
              onClick={() => setConfirmDeleteBoard(true)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium"
              style={{ color: "#b3261e" }}
            >
              <Icon name="trash" size={14} />
              {t("planner.deleteBoard")}
            </button>
          )}
        </div>
      </div>

      {/* Board controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={scrollToTodayWeek}
          className="rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink"
        >
          {t("planner.today")}
        </button>
      </div>

      {/* Board: full month, sideways pan, Who column is the sticky
          sidebar, grid lines are a background layer under the pills */}
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div
          ref={scrollRef}
          onPointerDown={onPanDown}
          onPointerMove={onPanMove}
          onPointerUp={onPanEnd}
          onPointerCancel={onPanEnd}
          onLostPointerCapture={onPanEnd}
          onDragStart={(e) => e.preventDefault()}
          className={`overflow-x-auto overflow-y-hidden [scrollbar-width:none] select-none [touch-action:pan-y] [&::-webkit-scrollbar]:hidden ${
            panning || drag?.active ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div className="relative isolate flex" style={{ width: BOARD_W }}>
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
              {SAMPLE_DAYS.map((day, i) =>
                day.weekend ? (
                  <div
                    key={day.date}
                    className="absolute inset-y-0 bg-ink/[0.02]"
                    style={{ left: WHO_W + i * DAY_W, width: DAY_W }}
                  />
                ) : null,
              )}
              <div
                className="absolute inset-y-0 bg-ink/[0.04]"
                style={{ left: WHO_W + TODAY_INDEX * DAY_W, width: DAY_W }}
              />
              {SAMPLE_DAYS.map((day, i) => (
                <div
                  key={day.date}
                  className="absolute inset-y-0 w-px bg-line"
                  style={{ left: WHO_W + i * DAY_W }}
                />
              ))}
              {rowBoundaries.map((top, i) => (
                <div
                  key={i}
                  className="absolute right-0 left-0 h-px bg-line"
                  style={{
                    top: top - 1,
                    transition: "top 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              ))}
            </div>

            {/* Who column: ONE sticky board-level column in the
                topmost layer (z-50), no longer a cell inside each
                row. Pills, the past-days wash and the today line
                all pass underneath it, never over a member. */}
            <div
              className="sticky left-0 z-50 flex shrink-0 flex-col border-r border-line bg-surface"
              style={{ width: WHO_W }}
            >
              <div className="flex h-12 items-center px-4 font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                {t("planner.who")}
              </div>
              {members.map((member, mi) => (
                <div
                  key={member.name}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    // Like a pill press: stop the pan scroller
                    // from capturing this pointer, or the panel
                    // would never open. onPanDown calls
                    // setPointerCapture on every press, which
                    // retargets the click to the scroller.
                    e.stopPropagation();
                    stopMomentum();
                    rowDownRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onPointerUp={(e) => {
                    const d = rowDownRef.current;
                    rowDownRef.current = null;
                    if (
                      d &&
                      Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6
                    ) {
                      openMemberPanel(mi);
                    }
                  }}
                  onPointerCancel={() => {
                    rowDownRef.current = null;
                  }}
                  className="flex cursor-pointer items-center gap-3 border-t border-line px-4 hover:bg-active/50"
                  style={{
                    height: rowHeights[mi],
                    transition:
                      "height 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <Avatar
                    alt={displayName(mi)}
                    size={30}
                    src={photoFor(mi)}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-start gap-1.5 text-sm font-medium leading-tight text-ink">
                      <span className="min-w-0 break-words">
                        {displayName(mi)}
                      </span>
                      {mi === 0 && (
                        <Icon
                          name="crown"
                          size={13}
                          className="mt-0.5 shrink-0 text-accent"
                        />
                      )}
                      {member.pm && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                          {t("planner.rolePm")}
                        </span>
                      )}
                    </span>
                    
                                          <span className="truncate text-2xs text-muted">
                      {member.role}
                    </span>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={16}
                    className="ml-auto shrink-0 text-muted"
                  />
                </div>
              ))}
            </div>

            {/* Days column: the date header + one day area per
                member, aligned with the Who column by height */}
            <div
              className="relative z-10 flex shrink-0 flex-col"
              style={{ width: SAMPLE_DAYS.length * DAY_W }}
            >
            {/* Board header */}
            <div className="relative flex h-12 items-stretch">
              {SAMPLE_DAYS.map((day) => {
                const isToday = day.date === SAMPLE_TODAY;
                return (
                  <div
                    key={day.date}
                    className="flex shrink-0 flex-col items-center justify-center gap-0.5"
                    style={{ width: DAY_W }}
                  >
                    <span
                      className={`text-2xs font-medium uppercase tracking-wide ${
                        day.weekend ? "text-subtle" : "text-muted"
                      }`}
                    >
                      {day.dow}
                    </span>
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        day.weekend && !isToday ? "text-subtle" : "text-ink"
                      }`}
                    >
                      {day.date}
                    </span>
                  </div>
                );
              })}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-[12]"
                style={{
                  left: 0,
                  width: TODAY_INDEX * DAY_W,
                  backgroundColor: "rgba(128, 128, 128, 0.32)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-[15] w-[2px] bg-ink"
                style={{ left: TODAY_INDEX * DAY_W }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-1.5 z-[15] -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-surface"
                style={{ left: TODAY_INDEX * DAY_W }}
              >
                {SAMPLE_TODAY}
              </div>
            </div>

            {/* Member day areas (their Who cells live in the
                sticky column on the left) */}
            {members.map((member, mi) => {
              const lanes = rowHeights[mi] / LANE_H;
              return (
                <div
                  key={member.name}
                  className="relative"
                  style={{
                    width: SAMPLE_DAYS.length * DAY_W,
                    height: lanes * LANE_H,
                    transition:
                      "height 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 z-[12]"
                      style={{
                        width: TODAY_INDEX * DAY_W,
                        backgroundColor: "rgba(128, 128, 128, 0.32)",
                      }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 z-[15] w-[2px] bg-ink"
                      style={{ left: TODAY_INDEX * DAY_W }}
                    />
                    {member.tasks.map((task) => {
                      const d =
                        drag && drag.member === mi && drag.title === task.title
                          ? drag
                          : null;
                      const gate = dragGate(mi, task);
                      const baseLeft = task.day * DAY_W + 6;
                      const baseWidth = (task.span ?? 1) * DAY_W - 12;
                      return (
                        <SamplePill
                          key={task.title}
                          task={task}
                          onPointerDown={(e) => onPillDown(e, mi, task)}
                          onResizeDown={
                            gate
                              ? undefined
                              : (edge, e) => onResizeDown(edge, e, mi, task)
                          }
                          className={`absolute h-11 [touch-action:none] ${
                            d ? "z-40" : "z-10"
                          } ${gate ? "cursor-not-allowed" : "cursor-grab"} ${
                            d?.invalid ? "opacity-60" : ""
                          }`}
                          style={{
                            left:
                              d?.kind === "resize-l" ? baseLeft + d.dx : baseLeft,
                            width:
                              d?.kind === "resize-r"
                                ? baseWidth + d.dx
                                : d?.kind === "resize-l"
                                  ? baseWidth - d.dx
                                  : baseWidth,
                            top: (task.lane ?? 0) * LANE_H + 4,
                            transform:
                              d?.kind === "move"
                                ? `translate(${d.dx}px, ${d.dy}px) scale(${d.active ? 1.04 : 1})`
                                : undefined,
                            transition: d?.settling
                              ? d.kind === "move"
                                ? "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)"
                                : "left 150ms cubic-bezier(0.22, 1, 0.36, 1), width 150ms cubic-bezier(0.22, 1, 0.36, 1)"
                              : d
                                ? undefined
                                : settleKey === `${mi}:${task.title}`
                                  ? undefined
                                  : "left 260ms cubic-bezier(0.22, 1, 0.36, 1), top 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                            boxShadow: d?.active
                              ? d.kind === "move"
                                ? "0 16px 32px rgba(0, 0, 0, 0.28)"
                                : "0 8px 20px rgba(0, 0, 0, 0.18)"
                              : undefined,
                            willChange: d ? "transform, width, left" : undefined,
                          }}
                        />
                      );
                    })}
                </div>
              );
            })}
            </div>
          </div>
        </div>

      </div>



      {/* Task detail: a Notion-style panel sliding in from the
          right when a pill is clicked. Properties read like a
          Notion page (icon + label column, value beside it); the
          one live action for now is marking done / reopening. */}
      {/* Member panel: slides in from the right when a Who
          row is clicked; same Side Peek pattern as the task
          detail. The job role can be typed or picked from
          the roles already used across boards; the board
          role is PM / Member, owner locked. */}
      {memberPanel !== null && panelMember && (
        <>
          <div
            aria-hidden
            onClick={closeMemberPanel}
            className={`fixed inset-0 z-[80] backdrop-blur-sm ${
              memberLeaving ? "modal-overlay-out" : "modal-overlay-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}
          />
          <aside
            className={`fixed inset-y-0 right-0 z-[90] flex flex-col border-l border-line bg-surface shadow-2xl ${
              memberLeaving ? "sheet-out" : "sheet-in"
            }`}
            style={{ width: "clamp(320px, 50vw, 900px)" }}
          >
            <div className="flex items-center justify-between px-6 pt-5">
              <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                {t("planner.member")}
              </span>
              <button
                type="button"
                onClick={closeMemberPanel}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-active hover:text-ink"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6 card-stagger" style={{ "--stagger-i": 0 } as CSSProperties}>
              <div
                className="flex items-center gap-3 card-stagger"
                style={{ "--stagger-i": 0 } as CSSProperties}
              >
                <Avatar
                  alt={displayName(memberPanel)}
                  size={44}
                  src={photoFor(memberPanel)}
                />
                <div className="flex min-w-0 flex-col">
                  <h2 className="truncate text-xl font-semibold text-ink">
                    {displayName(memberPanel)}
                  </h2>
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    {panelMember.role}
                    {panelMember.pm && (
                      <span className="rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                        {t("planner.rolePm")}
                      </span>
                    )}
                    {memberPanel === 0 && (
                      <span className="text-sm text-muted">
                        {t("planner.roleOwner")}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                {t("planner.memberOpenTasks", { count: panelOpenCount })}
              </p>

              {/* Job role: type it, or pick one already used. */}
              <div
                className="mt-6 flex flex-col gap-2 card-stagger"
                style={{ "--stagger-i": 1 } as CSSProperties}
              >
                <label
                  htmlFor="member-role-input"
                  className="font-mono text-2xs font-medium uppercase tracking-wider text-muted"
                >
                  {t("planner.jobRole")}
                </label>
                {canEditRoles ? (
                  <>
                    <input
                      id="member-role-input"
                      type="text"
                      value={roleDraft}
                      onChange={(e) => setRoleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitJobRole(roleDraft);
                      }}
                      placeholder={t("planner.rolePlaceholder")}
                      className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent"
                    />
                    <div className="mt-1 flex max-h-56 flex-col overflow-y-auto py-1">
                      {filteredRoles.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => commitJobRole(r)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-active"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {r}
                          </span>
                          {r === panelMember.role && (
                            <Icon
                              name="check"
                              size={16}
                              className="shrink-0 text-accent"
                            />
                          )}
                        </button>
                      ))}
                      {roleDraft.trim() !== "" &&
                        !isReservedOwnerRole(roleDraft.trim()) &&
                        !filteredRoles.some(
                          (r) =>
                            r.toLowerCase() ===
                            roleDraft.trim().toLowerCase(),
                        ) && (
                          <button
                            type="button"
                            onClick={() => commitJobRole(roleDraft.trim())}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-active"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {t("planner.useRole", {
                                role: toTitleCase(roleDraft.trim()),
                              })}
                            </span>
                          </button>
                        )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink">{panelMember.role}</p>
                )}
              </div>

              {/* Board role: PM / Member, owner locked. */}
              {board.kind === "team" && (
                <div
                  className="mt-6 flex flex-col gap-2 card-stagger"
                  style={{ "--stagger-i": 2 } as CSSProperties}
                >
                  <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                    {t("planner.boardRole")}
                  </span>
                  {memberPanel === 0 ? (
                    <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm">
                      <Icon
                        name="crown"
                        size={15}
                        className="shrink-0 text-accent"
                      />
                      <span className="font-medium text-ink">
                        {t("planner.roleOwner")}
                      </span>
                    </div>
                  ) : canEditRoles ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setMemberRole(memberPanel, true)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-active"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {t("planner.rolePm")}
                        </span>
                        {panelMember.pm && (
                          <Icon
                            name="check"
                            size={16}
                            className="shrink-0 text-accent"
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberRole(memberPanel, false)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-active"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {t("planner.roleMember")}
                        </span>
                        {!panelMember.pm && (
                          <Icon
                            name="check"
                            size={16}
                            className="shrink-0 text-accent"
                          />
                        )}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-ink">
                      {panelMember.pm
                        ? t("planner.rolePm")
                        : t("planner.roleMember")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {detail && detailMember && detailTask && (
        <>
          <div
            aria-hidden
            onClick={closeDetail}
            className={`fixed inset-0 z-[80] backdrop-blur-sm ${
              detailLeaving ? "modal-overlay-out" : "modal-overlay-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}
          />
          <aside
            className={`fixed inset-y-0 right-0 z-[90] flex flex-col border-l border-line bg-surface shadow-2xl ${
              detailLeaving ? "sheet-out" : "sheet-in"
            }`}
            style={{ width: "clamp(320px, 50vw, 900px)" }}
          >
            <div className="flex items-center justify-between px-6 pt-5">
              <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                {t("planner.task")}
              </span>
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-active hover:text-ink"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6 card-stagger" style={{ "--stagger-i": 0 } as CSSProperties}>
              <h2 className="text-2xl leading-snug font-semibold text-ink">
                {detailTask.title}
              </h2>
              <div className="mt-4 flex flex-col">
                <DetailRow icon="user" label={t("planner.assignee")}>
                  <Avatar
                    alt={displayName(detail.member)}
                    size={22}
                    src={photoFor(detail.member)}
                  />
                  <span>{displayName(detail.member)}</span>
                  <span className="text-muted">· {detailMember.role}</span>
                </DetailRow>
                <DetailRow icon="shapes" label={t("planner.icon")}>
                  {detailCanEdit ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIconMenuOpen((v) => !v)}
                        className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-sm text-ink hover:bg-active"
                      >
                        <Icon name={detailTask.icon ?? "edit"} size={15} />
                        <Icon name="chevron-down" size={12} />
                      </button>
                      {iconMenuOpen && (
                        <>
                          <div
                            aria-hidden
                            className="fixed inset-0 z-40"
                            onClick={() => setIconMenuOpen(false)}
                          />
                          <div className="absolute top-full left-0 z-50 mt-1 grid w-52 grid-cols-4 gap-1 rounded-lg border border-line bg-surface p-2 shadow-2xl">
                            {TASK_ICONS.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => setDetailIcon(name)}
                                aria-label={name}
                                className={`flex h-9 items-center justify-center rounded-md text-ink hover:bg-active ${(detailTask.icon ?? "edit") === name ? "bg-active" : ""}`}
                              >
                                <Icon name={name} size={17} />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-sm text-ink">
                      <Icon name={detailTask.icon ?? "edit"} size={15} />
                    </span>
                  )}
                </DetailRow>

                <DetailRow icon="calendar" label={t("planner.dueDate")}>
                  {detailCanEdit ? (
                    <div className="flex w-full items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <DateField
                          value={isoForDay(detailTask.day)}
                          todayOverride={BOARD_TODAY}
                          onChange={(v) => {
                            if (v) changeDetailDay(pickDay(v));
                          }}
                        />
                      </div>
                      <span className="text-muted">→</span>
                      <div className="min-w-0 flex-1">
                        <DateField
                          value={isoForDay(detailTask.day + detailSpan - 1)}
                          todayOverride={BOARD_TODAY}
                          onChange={(v) => {
                            if (!v) return;
                            const endDay = Math.max(
                              detailTask.day,
                              pickDay(v),
                            );
                            changeDetailSpan(endDay - detailTask.day + 1);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    detailDateText
                  )}
                  {detailTask.overdue && !detailTask.done && (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#b3261e" }}
                    >
                      {t("planner.overdue")}
                    </span>
                  )}
                </DetailRow>
                <DetailRow icon="time" label={t("planner.duration")}>
                  {t("planner.daysCount").replace("{n}", String(detailSpan))}
                </DetailRow>
                {detailTask.follows && SAMPLE_FOLLOWS[detailTask.title] && (
                  <DetailRow icon="link" label={t("planner.follows")}>
                    {SAMPLE_FOLLOWS[detailTask.title]}
                  </DetailRow>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={!detailCanEdit}
                  onClick={toggleDetailDone}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    detailTask.done
                      ? "border border-line text-ink"
                      : "bg-ink text-surface"
                  } ${!detailCanEdit ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Icon name="check" size={15} />
                  {detailTask.done
                    ? t("planner.reopen")
                    : t("planner.markDone")}
                </button>
                {detailCanEdit && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-active"
                    style={{ color: "#b3261e" }}
                  >
                    <Icon name="trash" size={15} />
                    {t("planner.deleteTask")}
                  </button>
                )}
              </div>
              <div className="mt-6 border-t border-line pt-4">
                <BlockBody
                  blocks={detailTask.blocks ?? []}
                  editable={detailCanEdit}
                  onChange={updateDetailBlocks}
                />
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Delete confirmation: destructive, so it always asks
          first. Rendered only when a detail is open; the
          delete button itself is gated by detailCanEdit. */}
      {confirmDelete && detailTask && (
        <>
          <div
            aria-hidden
            onClick={() => setConfirmDelete(false)}
            className="fixed inset-0 z-[97] backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}
          />
          <div
            className="fixed inset-0 z-[98] flex overflow-y-auto p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <div
              className="m-auto w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-ink">
                {t("planner.deleteTaskTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t("planner.deleteTaskBody")}
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={deleteDetailTask}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "#b3261e" }}
                >
                  {t("planner.deleteTask")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete board confirmation: owner only, destructive,
          so it always asks first. */}
      {confirmDeleteBoard && (
        <>
          <div
            aria-hidden
            onClick={() => setConfirmDeleteBoard(false)}
            className="fixed inset-0 z-[97] backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}
          />
          <div
            className="fixed inset-0 z-[98] flex overflow-y-auto p-4"
            onClick={() => setConfirmDeleteBoard(false)}
          >
            <div
              className="m-auto w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-ink">
                {t("planner.deleteBoardTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t("planner.deleteBoardBody")}
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteBoard(false)}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rest = boards.filter((b) => b.id !== board.id);
                    deleteBoard(board.id);
                    setConfirmDeleteBoard(false);
                    router.push(
                      rest.length > 0 ? `/tasks/${rest[0].id}` : "/tasks",
                    );
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "#b3261e" }}
                >
                  {t("planner.deleteBoard")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add task dialog: sits above the board (below the
          toast), closes on backdrop click or Escape. */}
      {addOpen && (
        <>
          <div
            aria-hidden
            onClick={() => setAddOpen(false)}
            className="fixed inset-0 z-[95] backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}
          />
          <div
            className="fixed inset-0 z-[96] flex overflow-y-auto p-4"
            onClick={() => setAddOpen(false)}
          >
            <div
              className="m-auto w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  {t("planner.addTask")}
                </h2>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-active hover:text-ink"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  autoFocus
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAdd();
                  }}
                  placeholder={t("planner.taskTitlePlaceholder")}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                    {t("planner.assignee")}
                  </span>
                  <MenuSelect
                    value={String(
                      viewer.key === "member" ? viewer.member : addMember,
                    )}
                    disabled={viewer.key === "member"}
                    onChange={(v) => setAddMember(Number(v))}
                    options={members.map((m, i) => ({
                      value: String(i),
                      label: displayName(i),
                    }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                    {t("planner.dueDate")}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <DateField
                        value={isoForDay(addStart)}
                        todayOverride={BOARD_TODAY}
                        popoverSide="top"
                        onChange={(v) => {
                          if (!v) return;
                          const n = pickDay(v);
                          setAddStart(n);
                          if (addEnd < n) setAddEnd(n);
                        }}
                      />
                    </div>
                    <span className="text-muted">-</span>
                    <div className="min-w-0 flex-1">
                      <DateField
                        value={isoForDay(addEnd)}
                        todayOverride={BOARD_TODAY}
                        popoverSide="top"
                        popoverAlign="right"
                        onChange={(v) => {
                          if (v) setAddEnd(Math.max(addStart, pickDay(v)));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitAdd}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface"
                >
                  {t("planner.addTask")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Move feedback: every successful move or resize confirms
          itself here, and every rejected grab explains why. When
          the board is wired to the API, the same events also
          notify the task's owner. */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
        >
          <style>{`@keyframes planner-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes planner-toast-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }`}</style>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl ${
              toast.kind === "ok" ? "bg-ink text-surface" : "text-white"
            }`}
            style={{
              animation: toast.leaving
                ? "planner-toast-out 260ms cubic-bezier(0.5, 0, 0.75, 0) forwards"
                : "planner-toast-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
              backgroundColor: toast.kind === "warn" ? "#b3261e" : undefined,
            }}
          >
            <Icon
              name={toast.kind === "ok" ? "check" : "info-circle"}
              size={15}
            />
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}
