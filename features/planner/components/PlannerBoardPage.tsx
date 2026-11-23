"use client";

// features/planner/components/PlannerBoardPage.tsx
// UI-ONLY canvas for the Tasks page, following the FigCraft design
// pass (Talmo-style planner board). All data below is SAMPLE data so
// the layout can be judged and directed first — wiring to the
// planner API (real projects, drag & drop moves, task dialog) comes
// after the look is approved. Do not hook this up to the backend yet.
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
const SAMPLE_UNDATED: SampleTask[] = [
  { title: "Ide board mingguan per anggota", section: "Desain" },
  { title: "Cek lisensi font", section: "Riset" },
];

function SamplePill({
  task,
  className = "",
  style,
}: {
  task: SampleTask;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
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

  // Open on the week of "today" (Monday Nov 16).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = OPEN_SCROLL_DAYS * DAY_W;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (momentumRef.current) cancelAnimationFrame(momentumRef.current);
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
            panning ? "cursor-grabbing" : "cursor-grab"
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
            {SAMPLE_MEMBERS.map((member) => {
              const lanes = Math.max(
                1,
                ...member.tasks.map((task) => (task.lane ?? 0) + 1),
              );
              return (
                <div
                  key={member.name}
                  className="relative z-10 flex border-t border-line"
                >
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
                    {member.tasks.map((task) => (
                      <SamplePill
                        key={task.title}
                        task={task}
                        className="absolute z-10 h-11"
                        style={{
                          left: task.day * DAY_W + 6,
                          width: (task.span ?? 1) * DAY_W - 12,
                          top: (task.lane ?? 0) * LANE_H + 4,
                        }}
                      />
                    ))}
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
    </div>
  );
}
