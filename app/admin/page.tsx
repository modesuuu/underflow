"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/features/admin/components/AdminShell";
import { Pill } from "@/features/admin/components/ui";
import { Icon } from "@/components/ui/Icon";
import { fmtDateTime } from "@/features/admin/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { AdminPeriodStat, AdminTrendDay } from "@/features/admin/types";

/**
 * Admin Overview (spec-admin.md §7). Layout follows the
 * reference dashboard the user picked on 2026-11-16 (welcome
 * header, highlight cards with sparklines, progress area
 * chart + activity split donut, recent activity + needs
 * attention), rendered in the Underflow admin design system.
 * Every number comes from the overview payload: KPIs, the
 * 14-day series, and period totals with deltas against the
 * previous 14 days. No extra fetches.
 */

const ACTION_LABEL: Record<string, DictKey> = {
  remove_post: "admin.actRemovePost",
  remove_comment: "admin.actRemoveComment",
  remove_collab: "admin.actRemoveCollab",
  suspend_user: "admin.actSuspend",
  dismiss_report: "admin.actDismiss",
  restore_content: "admin.actRestore",
  unsuspend_user: "admin.actUnsuspend",
  grant_appeal: "admin.actGrantAppeal",
  deny_appeal: "admin.actDenyAppeal",
};

type SeriesKey = "registrations" | "posts" | "collabs";

const SERIES: { key: SeriesKey; labelKey: DictKey; color: string; faint?: boolean }[] = [
  { key: "registrations", labelKey: "admin.trendRegistrations", color: "var(--uf-accent)" },
  { key: "posts", labelKey: "admin.trendPosts", color: "var(--uf-ink)" },
  { key: "collabs", labelKey: "admin.trendCollabs", color: "var(--uf-accent)", faint: true },
];

const EMPTY_STAT: AdminPeriodStat = { total: 0, delta: 0 };

function DeltaPill({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
      style={
        up
          ? {
              background:
                "color-mix(in srgb, var(--color-success, #198100) 14%, transparent)",
              color: "var(--color-success, #198100)",
            }
          : {
              background:
                "color-mix(in srgb, var(--color-error, #c9303a) 12%, transparent)",
              color: "var(--color-error, #c9303a)",
            }
      }
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}%
    </span>
  );
}

function Sparkline({
  values,
  kind,
  color,
  faint,
}: {
  values: number[];
  kind: "bars" | "line" | "area";
  color: string;
  faint?: boolean;
}) {
  const W = 96;
  const H = 30;
  const max = Math.max(1, ...values);
  if (kind === "bars") {
    const bw = W / Math.max(1, values.length);
    return (
      <svg width={W} height={H} aria-hidden className="shrink-0">
        {values.map((v, i) => {
          const h = Math.max(2, (v / max) * (H - 2));
          return (
            <rect
              key={i}
              x={i * bw + 1}
              y={H - h}
              width={Math.max(1, bw - 2.5)}
              height={h}
              rx={1.5}
              fill={color}
              opacity={faint ? 0.45 : 0.9}
            />
          );
        })}
      </svg>
    );
  }
  if (values.length < 2) return <div style={{ width: W, height: H }} />;
  const pts = values.map(
    (v, i) =>
      [
        (i / (values.length - 1)) * (W - 4) + 2,
        H - 3 - (v / max) * (H - 8),
      ] as const,
  );
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return (
    <svg width={W} height={H} aria-hidden className="shrink-0">
      {kind === "area" && (
        <polygon
          points={"2," + (H - 1) + " " + line + " " + (W - 2) + "," + (H - 1)}
          fill={color}
          opacity={0.16}
        />
      )}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={faint ? 0.7 : 1}
      />
    </svg>
  );
}

function HighlightCard({
  icon,
  label,
  value,
  delta,
  pillText,
  spark,
}: {
  icon: string;
  label: string;
  value: number;
  delta?: number | null;
  pillText?: string;
  spark: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
          <Icon name={icon} size={15} />
          <span className="truncate">{label}</span>
        </span>
        {delta !== undefined ? (
          delta === null ? (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium"
              style={{
                background:
                  "color-mix(in srgb, var(--color-success, #198100) 14%, transparent)",
                color: "var(--color-success, #198100)",
              }}
            >
              {t("admin.deltaNew")}
            </span>
          ) : (
            <DeltaPill delta={delta} />
          )
        ) : pillText ? (
          <span
            className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium"
            style={{ background: "var(--uf-bg)", color: "var(--uf-muted)" }}
          >
            {pillText}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <span className="text-[26px] leading-none font-semibold tracking-tight">
          {value}
        </span>
        {spark}
      </div>
    </div>
  );
}

function ProgressChart({
  days,
  seriesKey,
  color,
  label,
}: {
  days: AdminTrendDay[];
  seriesKey: SeriesKey;
  color: string;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 620;
  const H = 228;
  const PL = 30;
  const PR = 10;
  const PT = 16;
  const PB = 20;
  const values = days.map((d) => d[seriesKey]);
  const max = Math.max(1, ...values);
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const x = (i: number) =>
    PL + (values.length < 2 ? 0 : (i / (values.length - 1)) * iw);
  const y = (v: number) => PT + ih - (v / max) * ih;
  const line = values
    .map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1))
    .join(" ");
  const peak = values.indexOf(Math.max(...values));
  const gridFracs = [0, 0.5, 1];
  const labelIdx = [0, Math.floor((days.length - 1) / 2), days.length - 1];
  if (days.length < 2) {
    return <div className="py-10 text-center text-sm text-muted">-</div>;
  }
  const hovered = hover !== null ? hover : peak;
  const diff = hover !== null && hover > 0 ? values[hover] - values[hover - 1] : 0;
  const tipLeftPct = (x(hovered) / W) * 100;
  const tipShift =
    tipLeftPct < 14 ? "0%" : tipLeftPct > 86 ? "-100%" : "-50%";
  return (
    <div className="relative select-none">
      <svg
        viewBox={"0 0 " + W + " " + H}
        className="w-full cursor-crosshair"
        role="img"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const vx = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((vx - PL) / iw) * (values.length - 1));
          setHover(Math.max(0, Math.min(values.length - 1, i)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="ov-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.26} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {gridFracs.map((f) => (
          <g key={f}>
            <line
              x1={PL}
              x2={W - PR}
              y1={PT + ih - ih * f}
              y2={PT + ih - ih * f}
              stroke="var(--uf-line)"
              strokeDasharray={f === 0 ? undefined : "3 4"}
            />
            <text
              x={PL - 6}
              y={PT + ih - ih * f + 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--uf-muted)"
            >
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        <polygon
          points={PL + "," + (PT + ih) + " " + line + " " + x(values.length - 1) + "," + (PT + ih)}
          fill="url(#ov-area-fill)"
        />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PT}
            y2={PT + ih}
            stroke="var(--uf-muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )}
        <circle
          cx={x(hovered)}
          cy={y(values[hovered])}
          r={hover !== null ? 4.5 : 4}
          fill={color}
          stroke="var(--uf-bg)"
          strokeWidth={1.5}
          style={{ transition: "cx 0.12s ease-out, cy 0.12s ease-out" }}
        />
        {hover === null && (
          <text
            x={x(peak)}
            y={y(values[peak]) - 9}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="var(--uf-ink)"
          >
            {values[peak]}
          </text>
        )}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 5}
            textAnchor="middle"
            fontSize={10}
            fill="var(--uf-muted)"
          >
            {days[i].date.slice(5)}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 shadow-md"
          style={{
            left: tipLeftPct + "%",
            top: (y(values[hover]) / H) * 100 + "%",
            transform: "translate(" + tipShift + ", calc(-100% - 14px))",
            transition: "left 0.12s ease-out, top 0.12s ease-out",
          }}
        >
          <div className="text-[11px] whitespace-nowrap text-muted">
            {days[hover].date}
          </div>
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-sm font-semibold">{values[hover]}</span>
            <span className="text-[11px] text-muted">{label}</span>
            {hover > 0 && diff !== 0 && (
              <span
                className="text-[11px] font-medium"
                style={{
                  color:
                    diff > 0
                      ? "var(--color-success, #198100)"
                      : "var(--color-error, #c9303a)",
                }}
              >
                {diff > 0 ? "▲ +" + diff : "▼ " + diff}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SplitDonut({
  period,
}: {
  period: { registrations: AdminPeriodStat; posts: AdminPeriodStat; collabs: AdminPeriodStat };
}) {
  const { t } = useLanguage();
  const parts = SERIES.map((s) => ({ ...s, value: period[s.key].total }));
  const total = parts.reduce((a, p) => a + p.value, 0);
  const R = 40;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div>
      <div className="relative mx-auto w-[128px]">
        <svg viewBox="0 0 100 100" className="w-full -rotate-90" role="img">
          <circle cx={50} cy={50} r={R} fill="none" stroke="var(--uf-line)" strokeWidth={11} />
          {total > 0 &&
            parts.map((p) => {
              const frac = p.value / total;
              const off = acc;
              acc += frac;
              if (frac <= 0) return null;
              return (
                <circle
                  key={p.key}
                  cx={50}
                  cy={50}
                  r={R}
                  fill="none"
                  stroke={p.color}
                  strokeOpacity={p.faint ? 0.4 : 1}
                  strokeWidth={11}
                  strokeDasharray={Math.max(0.5, frac * C - 2) + " " + C}
                  strokeDashoffset={-off * C}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] leading-none font-semibold tracking-tight">
            {total}
          </span>
          <span className="mt-1 text-[11px] text-muted">{t("admin.splitTotal")}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: p.color, opacity: p.faint ? 0.45 : 1 }}
            />
            <span className="flex-1 text-muted">{t(p.labelKey)}</span>
            <span className="font-medium">
              {total > 0 ? Math.round((p.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const { overview, viewer, refreshOverview } = useAdmin();
  const [series, setSeries] = useState<SeriesKey>("posts");
  const days = overview.trends ?? [];
  const period = overview.period ?? {
    registrations: EMPTY_STAT,
    posts: EMPTY_STAT,
    collabs: EMPTY_STAT,
  };
  const activeSeries = SERIES.find((s) => s.key === series) ?? SERIES[1];
  const attention: {
    href: string;
    icon: string;
    label: string;
    value: number;
    tone: "danger" | "warning" | "neutral";
  }[] = [
    {
      href: "/admin/reports",
      icon: "flag",
      label: t("admin.kpiOpenReports"),
      value: overview.reports_open,
      tone: "danger",
    },
    {
      href: "/admin/approvals",
      icon: "check-square",
      label: t("admin.kpiRequestsWaiting"),
      value: overview.action_requests_pending,
      tone: "warning",
    },
    {
      href: "/admin/appeals",
      icon: "undo",
      label: t("admin.kpiAppealsWaiting"),
      value: overview.appeals_pending,
      tone: "warning",
    },
    {
      href: "/admin/users",
      icon: "user-x",
      label: t("admin.kpiSuspended"),
      value: overview.users_suspended,
      tone: "neutral",
    },
  ];
  const allClear = attention.every((a) => a.value === 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            {t("admin.welcomeBack")}
            {viewer ? ", " + viewer.username : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("admin.overviewSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={refreshOverview}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--uf-bg)]"
        >
          <Icon name="rotate-right" size={14} />
          {t("admin.refresh")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <HighlightCard
          icon="group"
          label={t("admin.kpiTotalUsers")}
          value={overview.users_total}
          delta={period.registrations.delta}
          spark={
            <Sparkline
              values={days.map((d) => d.registrations)}
              kind="bars"
              color="var(--uf-accent)"
            />
          }
        />
        <HighlightCard
          icon="news"
          label={t("admin.trendPosts")}
          value={period.posts.total}
          delta={period.posts.delta}
          spark={
            <Sparkline
              values={days.map((d) => d.posts)}
              kind="line"
              color="var(--uf-ink)"
            />
          }
        />
        <HighlightCard
          icon="briefcase"
          label={t("admin.trendCollabs")}
          value={period.collabs.total}
          delta={period.collabs.delta}
          spark={
            <Sparkline
              values={days.map((d) => d.collabs)}
              kind="area"
              color="var(--uf-accent)"
            />
          }
        />
        <HighlightCard
          icon="layer"
          label={t("admin.kpiActiveCollabs")}
          value={overview.collabs_active}
          pillText={overview.collabs_total + " " + t("admin.totalSuffix")}
          spark={
            <Sparkline
              values={days.map((d) => d.collabs)}
              kind="bars"
              color="var(--uf-ink)"
            />
          }
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface px-4 py-4 xl:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">{t("admin.progressTitle")}</h2>
              <p className="mt-0.5 text-[13px] text-muted">
                {t("admin.progressSubtitle")}
              </p>
            </div>
            <div className="flex rounded-full border border-line p-0.5">
              {SERIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSeries(s.key)}
                  className="rounded-full px-3 py-1 text-[13px] transition-colors"
                  style={
                    series === s.key
                      ? { background: "var(--uf-ink)", color: "var(--uf-bg)" }
                      : { color: "var(--uf-muted)" }
                  }
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <ProgressChart
            days={days}
            seriesKey={series}
            color={activeSeries.color}
            label={t(activeSeries.labelKey)}
          />
        </div>

        <div className="rounded-lg border border-line bg-surface px-4 py-4">
          <h2 className="mb-3 text-[15px] font-semibold">{t("admin.splitTitle")}</h2>
          <SplitDonut period={period} />
        </div>
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-line bg-surface xl:col-span-2">
          <h2 className="px-4 pt-4 pb-1 text-[15px] font-semibold">
            {t("admin.recentActivity")}
          </h2>
          {overview.recent_activity.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted">
              {t("admin.noActivity")}
            </div>
          ) : (
            <div className="max-h-[372px] overflow-y-auto">
              {overview.recent_activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span>
                      <span className="font-medium">{a.actor_name}</span>{" "}
                      {ACTION_LABEL[a.action_type]
                        ? t(ACTION_LABEL[a.action_type])
                        : a.action_type}
                      {a.owner_name && (
                        <>
                          {" "}
                          · target: <span className="font-medium">{a.owner_name}</span>
                        </>
                      )}
                    </span>
                    {a.reason && (
                      <span className="truncate text-[13px] text-muted">{a.reason}</span>
                    )}
                  </div>
                  {Number(a.strike) === 1 && (
                    <Pill tone="danger">{t("admin.strike")}</Pill>
                  )}
                  <span className="shrink-0 text-[13px] text-subtle">
                    {fmtDateTime(a.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <h2 className="px-4 pt-4 pb-1 text-[15px] font-semibold">
            {t("admin.attentionTitle")}
          </h2>
          {allClear ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              {t("admin.allClear")}
            </div>
          ) : (
            attention.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2.5 border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--uf-bg)]"
              >
                <Icon name={a.icon} size={16} className="text-muted" />
                <span className="flex-1 text-sm">{a.label}</span>
                <Pill tone={a.value > 0 ? a.tone : "neutral"}>{a.value}</Pill>
                <Icon name="chevron-right" size={14} className="text-subtle" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
