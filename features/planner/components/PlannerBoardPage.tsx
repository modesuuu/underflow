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
// A small "view as" preview in the filter row stands in for the
// signed-in user while this page runs on sample data.
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
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
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
// The board opens on the week of "today": Monday Nov 16.
const OPEN_SCROLL_DAYS = 15;

// Who column width (px), one day column (px), and one pill lane
// (px). Pills are 44px tall (h-11) with 4px of air in a lane.
const WHO_W = 180;
const DAY_W = 132;
const LANE_H = 52;
const BOARD_W = WHO_W + SAMPLE_DAYS.length * DAY_W;

type SampleTask = {
  title: string;
  section?: string;
  icon?: string;
  done?: boolean;
  pencilled?: boolean;
  overdue?: boolean;
  follows?: boolean;
};

// A board task sits on the day area by day index (0 = Nov 1), can
// span several days, and stacks into a lane when two tasks share a
// day for the same member.
type BoardTask = SampleTask & { day: number; span?: number; lane?: number };

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

// Lane placement for a drop (Jev's pick, 0.95): the moved pill
// takes the nearest free lane to where it was dropped, searching
// downward first, then up, then a brand-new lane; afterwards empty
// lanes are compacted away so the row shrinks back. Other pills
// keep their lanes whenever possible.
function resolvePlacement(
  tasks: BoardTask[],
  title: string,
  day: number,
  lane: number,
): BoardTask[] {
  const moved = tasks.find((tk) => tk.title === title);
  if (!moved) return tasks;
  const span = moved.span ?? 1;
  const others = tasks.filter((tk) => tk.title !== title);
  const hits = (l: number) =>
    others.some(
      (o) =>
        (o.lane ?? 0) === l &&
        day < o.day + (o.span ?? 1) &&
        o.day < day + span,
    );
  let target = lane;
  if (hits(target)) {
    const maxLane = Math.max(0, ...others.map((o) => o.lane ?? 0));
    let found = -1;
    for (let l = target; l <= maxLane + 1 && found < 0; l++) {
      if (!hits(l)) found = l;
    }
    for (let l = target - 1; l >= 0 && found < 0; l--) {
      if (!hits(l)) found = l;
    }
    target = found < 0 ? maxLane + 1 : found;
  }
  const placed = tasks.map((tk) =>
    tk.title === title ? { ...tk, day, lane: target } : tk,
  );
  const used = [...new Set(placed.map((tk) => tk.lane ?? 0))].sort(
    (a, b) => a - b,
  );
  const remap = new Map(used.map((l, i) => [l, i]));
  return placed.map((tk) => ({ ...tk, lane: remap.get(tk.lane ?? 0) ?? 0 }));
}

const dayLabel = (day: number, span: number) =>
  span > 1 ? `${day + 1}–${day + span} Nov` : `${day + 1} Nov`;

// Sample-phase stand-in for the signed-in user: who is looking at
// the board decides whose pills may move.
const PERSONAS = [
  { key: "owner", member: 0 },
  { key: "pm", member: 1 },
  { key: "member", member: 3 },
] as const;
type ViewerKey = (typeof PERSONAS)[number]["key"];

type SampleMember = {
  name: string;
  role: string;
  pm?: boolean;
  tasks: BoardTask[];
};

const SAMPLE_MEMBERS: SampleMember[] = [
  {
    name: "Raka Alfarezi",
    role: "Frontend",
    tasks: [
      { title: "Desain board planner", section: "Desain", icon: "edit", day: 16 },
      { title: "Review PR backend", section: "Frontend", done: true, day: 17 },
      {
        title: "Implementasi board",
        section: "Frontend",
        follows: true,
        icon: "group",
        day: 17,
        span: 2,
        lane: 1,
      },
      { title: "Polish halaman profil", section: "Frontend", icon: "palette", day: 24 },
    ],
  },
  {
    name: "Faiz Aghitsna",
    role: "Backend",
    pm: true,
    tasks: [
      { title: "Audit endpoint lama", section: "Backend", icon: "search", day: 3 },
      { title: "Endpoint GET planner", section: "Backend", icon: "code-alt", day: 15 },
      {
        title: "Perbaiki CORS deploy",
        section: "Backend",
        overdue: true,
        icon: "wrench",
        day: 16,
      },
      { title: "Setup Cloudflare Tunnel", section: "Backend", icon: "server", day: 19 },
    ],
  },
  {
    name: "Fadilah Yasin",
    role: "Database",
    tasks: [
      { title: "Backup database", section: "Backend", icon: "server", day: 11 },
      { title: "Skema tabel collab_tasks", section: "Backend", done: true, day: 16 },
      {
        title: "Seed data demo",
        section: "Backend",
        pencilled: true,
        icon: "edit",
        day: 18,
        span: 2,
      },
    ],
  },
  {
    name: "Alifah Syarifah",
    role: "Research",
    tasks: [
      { title: "Survei pengguna", section: "Riset", icon: "group", day: 8 },
      { title: "Riset referensi Talmo", section: "Riset", icon: "search", day: 16 },
      {
        title: "Copywriting halaman Tasks",
        section: "Desain",
        pencilled: true,
        icon: "edit",
        day: 17,
      },
    ],
  },
  {
    name: "Alvina Putri",
    role: "Research",
    tasks: [
      { title: "Uji alur apply", section: "Riset", icon: "map-pin", day: 16 },
      { title: "Catatan rilis", section: "Riset", icon: "edit", day: 21 },
      { title: "Dokumentasi rilis", section: "Riset", icon: "edit", day: 26 },
    ],
  },
];

const SAMPLE_SECTIONS = ["Desain", "Frontend", "Backend", "Riset"];

// Row geometry for the background layer: header height + each
// member row's height (lanes * LANE_H). The horizontal separators
// live in the background layer with the column lines, so the past
// days wash covers them exactly like it covers the column lines.
// Heights are recomputed from the live task state on every render:
// rows are dynamic and follow their tasks.
const HEADER_H = 48;
const SAMPLE_UNDATED: SampleTask[] = [
  { title: "Ide board mingguan per anggota", section: "Desain" },
  { title: "Cek lisensi font", section: "Riset" },
];

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

export function PlannerBoardPage() {
  const { t } = useLanguage();
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
  const [members, setMembers] = useState<SampleMember[]>(SAMPLE_MEMBERS);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const pendingCommitRef = useRef<(() => void) | null>(null);
  const [viewerKey, setViewerKey] = useState<ViewerKey>("owner");
  const viewer = PERSONAS.find((p) => p.key === viewerKey) ?? PERSONAS[0];
  const [toast, setToast] = useState<{
    id: number;
    kind: "ok" | "warn";
    text: string;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: "ok" | "warn", text: string) => {
    setToast({ id: Date.now(), kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3400);
  };

  // Who may move a pill: done tasks never move; a member moves
  // only their own; the owner and PMs move anyone's.
  const dragGate = (mi: number, task: BoardTask): "done" | "own" | null => {
    if (task.done) return "done";
    if (viewer.key === "member" && viewer.member !== mi) return "own";
    return null;
  };
  const gateToast = (gate: "done" | "own") =>
    showToast(
      "warn",
      t(gate === "done" ? "planner.toastDone" : "planner.toastOwnOnly"),
    );

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
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const stopMomentum = () => {
    if (momentumRef.current) cancelAnimationFrame(momentumRef.current);
    momentumRef.current = null;
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

  // Pill drag: press a pill and it lifts and follows the pointer
  // 1:1 (Pointer Events, the same system as the canvas pan — the
  // approach Jev picked). Horizontal movement reschedules within
  // the member's own row; vertical movement only switches lanes
  // inside that row and rubber-bands at its edges. Releasing snaps
  // to the nearest day column; a drop into the gray past zone (or
  // onto another pill) is rejected and the pill glides back.
  const onPillDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    mi: number,
    task: BoardTask,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const gate = dragGate(mi, task);
    if (gate) {
      gateToast(gate);
      return;
    }
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

    const judge = (dx: number, dy: number) => {
      const day = Math.round(task.day + dx / DAY_W);
      const lane = Math.min(
        lanes,
        Math.max(0, Math.round(lane0 + dy / LANE_H)),
      );
      return { day, lane, ok: day >= TODAY_INDEX };
    };
    const onMove = (ev: PointerEvent) => {
      let dx = Math.min(maxDx, Math.max(minDx, ev.clientX - startX));
      let dy = ev.clientY - startY;
      if (dy < minDy) dy = minDy + (dy - minDy) * 0.35;
      if (dy > maxDy) dy = maxDy + (dy - maxDy) * 0.35;
      if (!live && Math.hypot(dx, dy) < 5) return;
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
      if (dragRafRef.current) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (live) setDrag({ ...live });
      });
    };
    const onUp = (cancelled: boolean) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUpFalse);
      window.removeEventListener("pointercancel", onUpTrue);
      if (!live) return;
      const { dx, dy } = live;
      const verdict = judge(dx, dy);
      const intoPast = verdict.day < TODAY_INDEX;
      const valid = !cancelled && !intoPast;
      const resolved = valid
        ? resolvePlacement(member.tasks, task.title, verdict.day, verdict.lane)
        : null;
      const placed = resolved?.find((tk) => tk.title === task.title);
      const targetDx = placed ? (placed.day - task.day) * DAY_W : 0;
      const targetDy = placed ? ((placed.lane ?? 0) - lane0) * LANE_H : 0;
      setDrag({ ...live, dx: targetDx, dy: targetDy, settling: true });
      pendingCommitRef.current = () => {
        if (resolved && placed) {
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
    const onMove = (ev: PointerEvent) => {
      const dx = Math.min(maxDx, Math.max(minDx, ev.clientX - startX));
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
      if (dragRafRef.current) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (live) setDrag({ ...live });
      });
    };
    const onUp = (cancelled: boolean) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUpFalse);
      window.removeEventListener("pointercancel", onUpTrue);
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
          setMembers((prev) =>
            prev.map((m, i) =>
              i !== mi
                ? m
                : {
                    ...m,
                    tasks: m.tasks.map((tk) =>
                      tk.title === task.title
                        ? { ...tk, day: newDay, span: newSpan }
                        : tk,
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

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-medium tracking-tight text-ink">
            {t("planner.title")}
          </h1>
          <p className="text-sm text-muted">
            {t("planner.monthLabel")} · {t("planner.boardSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex max-w-[240px] items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink"
          >
            <span className="truncate">Underflow — Web App</span>
            <Icon name="chevron-down" size={14} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface"
          >
            <Icon name="plus" size={14} />
            {t("planner.addTask")}
          </button>
        </div>
      </div>

      {/* Section filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={scrollToTodayWeek}
          className="rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink"
        >
          {t("planner.today")}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
            {t("planner.viewAs")}
          </span>
          <div className="flex rounded-full border border-line bg-surface p-0.5">
            {PERSONAS.map((persona) => (
              <button
                key={persona.key}
                type="button"
                onClick={() => setViewerKey(persona.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  viewerKey === persona.key
                    ? "bg-ink text-surface"
                    : "text-muted"
                }`}
              >
                {t(
                  persona.key === "owner"
                    ? "planner.roleOwner"
                    : persona.key === "pm"
                      ? "planner.rolePm"
                      : "planner.roleMember",
                )}{" "}
                · {SAMPLE_MEMBERS[persona.member].name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="rounded-full bg-ink px-3.5 py-2 text-xs font-medium text-surface"
          >
            {t("planner.filterAll")}
          </button>
          {SAMPLE_SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink"
            >
              {section}
            </button>
          ))}
          <button
            type="button"
            className="rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink"
          >
            {t("planner.noSection")}
          </button>
        </div>
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
          <div className="relative isolate" style={{ width: BOARD_W }}>
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
              {rowBoundaries.map((top) => (
                <div
                  key={top}
                  className="absolute right-0 left-0 h-px bg-line"
                  style={{ top: top - 1 }}
                />
              ))}
            </div>

            {/* Board header */}
            <div className="relative z-10 flex h-12 items-stretch">
              <div
                className="sticky left-0 z-30 flex shrink-0 items-center border-r border-line bg-surface px-4 font-mono text-2xs font-medium uppercase tracking-wider text-muted"
                style={{ width: WHO_W }}
              >
                {t("planner.who")}
              </div>
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
                  left: WHO_W,
                  width: TODAY_INDEX * DAY_W,
                  backgroundColor: "rgba(128, 128, 128, 0.32)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-[15] w-[2px] bg-ink"
                style={{ left: WHO_W + TODAY_INDEX * DAY_W }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-1.5 z-[15] -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-surface"
                style={{ left: WHO_W + TODAY_INDEX * DAY_W }}
              >
                {SAMPLE_TODAY}
              </div>
            </div>

            {/* Member rows */}
            {members.map((member, mi) => {
              const lanes = rowHeights[mi] / LANE_H;
              return (
                <div key={member.name} className="relative z-10 flex">
                  <div
                    className="sticky left-0 z-20 flex shrink-0 items-center gap-3 border-t border-r border-line bg-surface px-4"
                    style={{ width: WHO_W }}
                  >
                    <Avatar alt={member.name} size={30} />
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 truncate text-sm font-medium leading-tight text-ink">
                        {member.name}
                        {member.pm && (
                          <span className="rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                            {t("planner.rolePm")}
                          </span>
                        )}
                      </span>
                      <span className="text-2xs text-muted">{member.role}</span>
                    </div>
                  </div>
                  <div
                    className="relative shrink-0"
                    style={{
                      width: SAMPLE_DAYS.length * DAY_W,
                      height: lanes * LANE_H,
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
                              : undefined,
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
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Undated strip */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line px-4 py-3">
        <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
          {t("planner.noDateRow")}
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_UNDATED.map((task) => (
            <SamplePill key={task.title} task={task} className="h-11 w-56" />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-full bg-ink" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-full border border-line bg-surface" />
          Pencilled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-full bg-active" />
          Done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-ink" />
          Follows
        </span>
      </div>

      {/* Move feedback: every successful move or resize confirms
          itself here, and every rejected grab explains why. When
          the board is wired to the API, the same events also
          notify the task's owner. */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
        >
          <style>{`@keyframes planner-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl ${
              toast.kind === "ok" ? "bg-ink text-surface" : "text-white"
            }`}
            style={{
              animation:
                "planner-toast-in 180ms cubic-bezier(0.22, 1, 0.36, 1)",
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
