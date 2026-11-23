"use client";

// features/planner/components/PlannerBoardPage.tsx
// UI-ONLY canvas for the Tasks page, following the FigCraft design
// pass (Talmo-style weekly board). All data below is SAMPLE data so
// the layout can be judged and directed first — wiring to the
// planner API (real projects, drag & drop moves, task dialog) comes
// after the look is approved. Do not hook this up to the backend yet.
//
// Board structure mirrors the reference: the grid is a BACKGROUND
// layer (continuous vertical lines + today's band and start line),
// and pills are positioned freely on top of it — a pill can span
// several day columns and crosses the lines, it is not boxed into
// a cell.

import type { CSSProperties } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// Sample week: Mon 16 – Sun 22 Nov, "today" is Tue 17 (mirrors the
// FigCraft reference so the two can be compared side by side).
const SAMPLE_DAYS = [
  { dow: "Mon", date: 16 },
  { dow: "Tue", date: 17 },
  { dow: "Wed", date: 18 },
  { dow: "Thu", date: 19 },
  { dow: "Fri", date: 20 },
  { dow: "Sat", date: 21 },
  { dow: "Sun", date: 22 },
];
const SAMPLE_TODAY = 17;
const TODAY_INDEX = SAMPLE_DAYS.findIndex((d) => d.date === SAMPLE_TODAY);

// Who column width (px) and the height of one pill lane (px). Pills
// are 44px tall (h-11) with 4px of air above and below in a lane.
const WHO_W = 180;
const LANE_H = 52;

type SampleTask = {
  title: string;
  section?: string;
  icon?: string;
  done?: boolean;
  pencilled?: boolean;
  overdue?: boolean;
  follows?: boolean;
};

// A board task sits on the day area by day index (0 = Mon), can
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
      { title: "Desain board planner", section: "Desain", icon: "edit", day: 1 },
      {
        title: "Review PR backend",
        section: "Frontend",
        done: true,
        day: 2,
      },
      {
        title: "Implementasi board",
        section: "Frontend",
        follows: true,
        icon: "group",
        day: 2,
        span: 2,
        lane: 1,
      },
    ],
  },
  {
    name: "Faiz Aghitsna",
    role: "Backend",
    pm: true,
    tasks: [
      { title: "Endpoint GET planner", section: "Backend", icon: "code-alt", day: 0 },
      {
        title: "Perbaiki CORS deploy",
        section: "Backend",
        overdue: true,
        icon: "wrench",
        day: 1,
      },
      { title: "Setup Cloudflare Tunnel", section: "Backend", icon: "server", day: 4 },
    ],
  },
  {
    name: "Fadilah Yasin",
    role: "Database",
    tasks: [
      { title: "Skema tabel collab_tasks", section: "Backend", done: true, day: 1 },
      {
        title: "Seed data demo",
        section: "Backend",
        pencilled: true,
        icon: "edit",
        day: 3,
        span: 2,
      },
    ],
  },
  {
    name: "Alifah Syarifah",
    role: "Research",
    tasks: [
      { title: "Riset referensi Talmo", section: "Riset", icon: "search", day: 1 },
      {
        title: "Copywriting halaman Tasks",
        section: "Desain",
        pencilled: true,
        icon: "edit",
        day: 2,
      },
    ],
  },
  {
    name: "Alvina Putri",
    role: "Research",
    tasks: [
      { title: "Uji alur apply", section: "Riset", icon: "map-pin", day: 1 },
      { title: "Catatan rilis", section: "Riset", icon: "edit", day: 6 },
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
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className={`truncate text-[11px] font-semibold leading-tight ${
            task.done ? "line-through" : ""
          }`}
        >
          {task.title}
        </span>
      </span>
    </div>
  );
}

// Left edge of day column i inside the board card, as a CSS calc
// string: the fixed Who column plus i/7 of the remaining width.
const dayLeft = (i: number) =>
  `calc(${WHO_W}px + (100% - ${WHO_W}px) * ${Number((i / 7).toFixed(6))})`;
const dayWidth = `calc((100% - ${WHO_W}px) * ${Number((1 / 7).toFixed(6))})`;

export function PlannerBoardPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-medium tracking-tight text-ink">
            {t("planner.title")}
          </h1>
          <p className="text-sm text-muted">
            {t("planner.weekOf", { date: "16 Nov" })} ·{" "}
            {t("planner.boardSubtitle")}
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

      {/* Week strip + section filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1.5">
          <span className="rounded-full p-1.5 text-muted">
            <Icon name="chevron-left" size={16} />
          </span>
          {SAMPLE_DAYS.map((day) => {
            const isToday = day.date === SAMPLE_TODAY;
            return (
              <div
                key={day.date}
                className={`flex min-w-[52px] flex-col items-center rounded-full px-2 py-1 ${
                  isToday ? "bg-ink text-surface" : "text-ink"
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    isToday ? "text-surface/70" : "text-muted"
                  }`}
                >
                  {day.dow}
                </span>
                <span className="text-sm font-semibold leading-tight">
                  {day.date}
                </span>
              </div>
            );
          })}
          <span className="rounded-full p-1.5 text-muted">
            <Icon name="chevron-right" size={16} />
          </span>
        </div>
        <button
          type="button"
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

      {/* Board: grid lines are a background layer, pills float on top */}
      <div className="overflow-x-auto">
        <div className="relative isolate min-w-[1024px] overflow-hidden rounded-lg border border-line bg-surface">
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            <div
              className="absolute inset-y-0 bg-ink/[0.04]"
              style={{ left: dayLeft(TODAY_INDEX), width: dayWidth }}
            />
            {SAMPLE_DAYS.map((day, i) => (
              <div
                key={day.date}
                className="absolute inset-y-0 w-px bg-line"
                style={{ left: dayLeft(i) }}
              />
            ))}
            <div
              className="absolute inset-y-0 w-[2px] bg-ink opacity-70"
              style={{ left: dayLeft(TODAY_INDEX) }}
            />
          </div>

          {/* Board header */}
          <div className="relative z-10 flex h-12 items-center">
            <div
              className="shrink-0 px-4 font-mono text-2xs font-medium uppercase tracking-wider text-muted"
              style={{ width: WHO_W }}
            >
              {t("planner.who")}
            </div>
            <div className="grid flex-1 grid-cols-7">
              {SAMPLE_DAYS.map((day) => {
                const isToday = day.date === SAMPLE_TODAY;
                return (
                  <div
                    key={day.date}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <span className="text-2xs font-medium uppercase tracking-wide text-muted">
                      {day.dow}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? "rounded-full bg-ink px-1.5 py-px text-surface"
                          : "text-ink"
                      }`}
                    >
                      {day.date}
                    </span>
                  </div>
                );
              })}
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
                  className="flex shrink-0 items-center gap-3 px-4"
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
                  className="relative flex-1"
                  style={{ height: lanes * LANE_H }}
                >
                  {member.tasks.map((task) => (
                    <SamplePill
                      key={task.title}
                      task={task}
                      className="absolute z-10 h-11"
                      style={{
                        left: `calc(${(task.day * 100) / 7}% + 6px)`,
                        width: `calc(${((task.span ?? 1) * 100) / 7}% - 12px)`,
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
