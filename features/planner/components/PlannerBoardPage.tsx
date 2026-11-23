"use client";

// features/planner/components/PlannerBoardPage.tsx
// UI-ONLY canvas for the Tasks page, following the FigCraft design
// pass (Talmo-style weekly board). All data below is SAMPLE data so
// the layout can be judged and directed first — wiring to the
// planner API (real projects, drag & drop moves, task dialog) comes
// after the look is approved. Do not hook this up to the backend yet.

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const GRID_COLS = "200px repeat(7, minmax(0, 1fr))";

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

type SampleTask = {
  title: string;
  section?: string;
  done?: boolean;
  pencilled?: boolean;
  overdue?: boolean;
  follows?: boolean;
};

type SampleMember = {
  name: string;
  pm?: boolean;
  // Index = day of week (0 = Mon). Empty days are just absent.
  tasks: Record<number, SampleTask[]>;
};

const SAMPLE_MEMBERS: SampleMember[] = [
  {
    name: "Raka Alfarezi",
    tasks: {
      1: [{ title: "Desain board planner", section: "Desain" }],
      2: [{ title: "Review PR backend", section: "Frontend", done: true }],
      3: [
        {
          title: "Implementasi board",
          section: "Frontend",
          follows: true,
        },
      ],
    },
  },
  {
    name: "Faiz Aghitsna",
    pm: true,
    tasks: {
      0: [{ title: "Endpoint GET planner", section: "Backend" }],
      1: [{ title: "Perbaiki CORS deploy", section: "Backend", overdue: true }],
      4: [{ title: "Setup Cloudflare Tunnel", section: "Backend" }],
    },
  },
  {
    name: "Fadilah Yasin",
    tasks: {
      1: [{ title: "Skema tabel collab_tasks", section: "Backend", done: true }],
      3: [{ title: "Seed data demo", section: "Backend", pencilled: true }],
    },
  },
  {
    name: "Alifah Syarifah",
    tasks: {
      0: [{ title: "Riset referensi Talmo", section: "Riset" }],
      2: [{ title: "Copywriting halaman Tasks", section: "Desain", pencilled: true }],
    },
  },
  {
    name: "Alvina Putri",
    tasks: {
      1: [{ title: "Uji alur apply", section: "Riset" }],
      6: [{ title: "Catatan rilis", section: "Riset" }],
    },
  },
];

const SAMPLE_SECTIONS = ["Desain", "Frontend", "Backend", "Riset"];
const SAMPLE_UNDATED: SampleTask[] = [
  { title: "Ide board mingguan per anggota", section: "Desain" },
  { title: "Cek lisensi font", section: "Riset" },
];

function SamplePill({ task }: { task: SampleTask }) {
  return (
    <div
      className={`flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 ${
        task.done
          ? "bg-line text-ink/70"
          : task.pencilled
            ? "border border-line bg-surface text-ink"
            : "bg-ink text-surface"
      }`}
    >
      <span className="flex items-start gap-1.5">
        {task.done ? (
          <span className="mt-0.5 shrink-0">
            <Icon name="check" size={11} />
          </span>
        ) : task.overdue ? (
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
        ) : null}
        <span
          className={`line-clamp-2 text-xs font-medium leading-snug ${
            task.done ? "line-through" : ""
          }`}
        >
          {task.title}
        </span>
      </span>
      {(task.section || task.follows) && (
        <span className="flex items-center gap-1.5 text-[10px] opacity-70">
          {task.follows && <Icon name="subdirectory-right" size={10} />}
          {task.section}
        </span>
      )}
    </div>
  );
}

export function PlannerBoardPage() {
  const { t } = useLanguage();

  const countFor = (member: SampleMember) =>
    Object.values(member.tasks).reduce((sum, list) => sum + list.length, 0);

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

      {/* Board */}
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <div className="min-w-[900px]">
          <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>
            <div className="px-4 py-2.5 font-mono text-2xs font-medium uppercase tracking-wider text-muted">
              {t("planner.who")}
            </div>
            {SAMPLE_DAYS.map((day) => {
              const isToday = day.date === SAMPLE_TODAY;
              return (
                <div
                  key={day.date}
                  className="flex items-center justify-center gap-1.5 border-l border-line px-2 py-2.5"
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

          {SAMPLE_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="grid border-t border-line"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
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
                  <span className="text-2xs text-muted">
                    {t("planner.tasksCount", { n: countFor(member) })}
                  </span>
                </div>
              </div>
              {SAMPLE_DAYS.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className={`flex min-h-[68px] flex-col gap-1.5 border-l border-line px-1.5 py-1.5 ${
                    day.date === SAMPLE_TODAY ? "bg-ink/[0.04]" : ""
                  }`}
                >
                  {(member.tasks[dayIndex] ?? []).map((task) => (
                    <SamplePill key={task.title} task={task} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Undated strip */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line px-4 py-3">
        <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
          {t("planner.noDateRow")}
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_UNDATED.map((task) => (
            <div key={task.title} className="w-52">
              <SamplePill task={task} />
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-line bg-surface" />
          Pencilled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-line" />
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
