"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useAdmin } from "@/features/admin/components/AdminShell";
import {
  fmtDateTime,
  getAiFlags,
  getAiModOverview,
  getAiVerdicts,
  resolveAiFlag,
  retryAiJob,
} from "@/features/admin/api";
import type {
  AiModOverview,
  AiVerdictRow,
} from "@/features/admin/types";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Pill,
  TABLE_WRAP,
  TD,
  TH,
} from "@/features/admin/components/ui";

/**
 * Admin AI Moderation (spec-ai-moderator.md §4.6): queue state,
 * today's verdict counts and model spend, grey-zone flags waiting
 * on a human decision, failed jobs with retry, and the verdict log.
 * Decisions (resolve, retry) are super-admin actions; the backend
 * enforces that, monitors read.
 */

const SELECT_CLASS =
  "cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink";

const BTN =
  "cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink disabled:cursor-default disabled:opacity-40";

const DECISION_LABEL: Record<string, DictKey> = {
  remove: "admin.aiDecRemove",
  flag: "admin.aiDecFlag",
  clean: "admin.aiDecClean",
  gone: "admin.aiDecGone",
  error: "admin.aiDecError",
};

const DECISION_TONE: Record<string, "danger" | "warning" | "success" | "neutral"> = {
  remove: "danger",
  flag: "warning",
  clean: "success",
  gone: "neutral",
  error: "danger",
};

const CATEGORY_LABEL: Record<string, DictKey> = {
  judol: "admin.aiCatJudol",
  seksual: "admin.aiCatSeksual",
  kekerasan: "admin.aiCatKekerasan",
  miras: "admin.aiCatMiras",
  berbahaya: "admin.aiCatBerbahaya",
};

function ScoreSummary({ row }: { row: AiVerdictRow }) {
  const { t } = useLanguage();
  if (!row.scores) return <span className="text-subtle">-</span>;
  const entries = Object.entries(CATEGORY_LABEL)
    .map(([key, labelKey]) => ({
      key,
      labelKey,
      value: Number(row.scores?.[key as keyof typeof CATEGORY_LABEL] ?? 0),
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  if (entries.length === 0) return <span className="text-subtle">0</span>;
  return (
    <span className="text-[13px] whitespace-nowrap">
      {entries.map((e, i) => (
        <span key={e.key}>
          {i > 0 && <span className="text-subtle"> · </span>}
          {t(e.labelKey)}{" "}
          <span className={e.value >= 70 ? "font-semibold" : undefined}>
            {e.value}
          </span>
        </span>
      ))}
    </span>
  );
}

function TargetCell({ row }: { row: AiVerdictRow }) {
  return (
    <div className="max-w-[260px]">
      <div className="truncate text-sm" title={row.target_label}>
        {row.target_label}
      </div>
      <div className="mt-0.5 text-xs text-subtle">
        {row.target_type}
        {row.owner_username ? ` · @${row.owner_username}` : ""}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default function AdminAiModerationPage() {
  const { t } = useLanguage();
  const { viewer } = useAdmin();
  const isSuper = viewer.role === "super_admin";

  const [overview, setOverview] = useState<AiModOverview | null>(null);
  const [flags, setFlags] = useState<AiVerdictRow[]>([]);
  const [decision, setDecision] = useState("all");
  const [page, setPage] = useState(1);
  const [verdicts, setVerdicts] = useState<{
    items: AiVerdictRow[];
    total: number;
    total_pages: number;
  } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  const loadMain = useCallback(async () => {
    const [ov, fl] = await Promise.all([getAiModOverview(), getAiFlags()]);
    setOverview(ov);
    setFlags(fl);
  }, []);

  const loadVerdicts = useCallback(async () => {
    const data = await getAiVerdicts({
      decision: decision === "all" ? undefined : decision,
      page,
      limit: 20,
    });
    setVerdicts(data);
  }, [decision, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadMain();
        if (!cancelled) setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMain, attempt]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadVerdicts();
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadVerdicts, attempt]);

  const act = async (id: string, run: () => Promise<void>) => {
    setBusyId(id);
    setActionError(false);
    try {
      await run();
      await Promise.all([loadMain(), loadVerdicts()]);
    } catch {
      setActionError(true);
    } finally {
      setBusyId(null);
    }
  };

  if (error && overview === null) {
    return <ErrorState onRetry={() => setAttempt((a) => a + 1)} />;
  }

  const vt = overview?.verdicts_today ?? {};

  return (
    <div>
      <PageHeader title={t("admin.aiTitle")} subtitle={t("admin.aiSubtitle")}>
        {overview &&
          (overview.enabled ? (
            <Pill tone="success">{t("admin.aiEnabled")}</Pill>
          ) : (
            <Pill tone="danger">{t("admin.aiDisabled")}</Pill>
          ))}
      </PageHeader>

      {!isSuper && (
        <p className="mb-4 text-sm text-muted">{t("admin.aiMonitorNote")}</p>
      )}
      {actionError && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-error, #c9303a)" }}>
          {t("admin.aiActionFailed")}
        </p>
      )}

      {overview && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t("admin.aiPending")} value={String(overview.jobs.pending)} />
            <StatCard label={t("admin.aiProcessing")} value={String(overview.jobs.processing)} />
            <StatCard label={t("admin.aiDone")} value={String(overview.jobs.done)} />
            <StatCard label={t("admin.aiFailed")} value={String(overview.jobs.failed)} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={`${t("admin.aiDecRemove")} · ${t("admin.aiToday")}`}
              value={String(vt.remove ?? 0)}
            />
            <StatCard
              label={`${t("admin.aiDecFlag")} · ${t("admin.aiToday")}`}
              value={String(vt.flag ?? 0)}
            />
            <StatCard
              label={`${t("admin.aiDecClean")} · ${t("admin.aiToday")}`}
              value={String(vt.clean ?? 0)}
            />
            <StatCard
              label={t("admin.aiModelCalls")}
              value={`${overview.model_calls_today} · $${overview.estimated_cost_today_usd.toFixed(4)}`}
            />
          </div>
        </>
      )}

      <h2 className="mt-8 text-[15px] font-semibold">{t("admin.aiFlagsTitle")}</h2>
      <p className="mt-0.5 text-[13px] text-muted">{t("admin.aiFlagsSubtitle")}</p>
      <div className={`mt-3 ${TABLE_WRAP}`}>
        {flags.length === 0 ? (
          <EmptyState>{t("admin.aiFlagsEmpty")}</EmptyState>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={TH}>{t("admin.aiColTarget")}</th>
                <th className={TH}>{t("admin.aiColScores")}</th>
                <th className={TH}>{t("admin.aiColReason")}</th>
                <th className={TH}>{t("admin.aiColWhen")}</th>
                {isSuper && <th className={TH}></th>}
              </tr>
            </thead>
            <tbody>
              {flags.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className={TD}>
                    <TargetCell row={row} />
                  </td>
                  <td className={TD}>
                    <ScoreSummary row={row} />
                  </td>
                  <td className={`${TD} max-w-[280px] text-sm text-muted`}>
                    {row.reason ?? "-"}
                  </td>
                  <td className={`${TD} text-sm whitespace-nowrap text-muted`}>
                    {fmtDateTime(row.created_at)}
                  </td>
                  {isSuper && (
                    <td className={`${TD} whitespace-nowrap`}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={BTN}
                          disabled={busyId === row.id}
                          onClick={() =>
                            act(row.id, () => resolveAiFlag(row.id, "removed"))
                          }
                          style={{ color: "var(--color-error, #c9303a)" }}
                        >
                          {t("admin.aiRemove")}
                        </button>
                        <button
                          type="button"
                          className={BTN}
                          disabled={busyId === row.id}
                          onClick={() =>
                            act(row.id, () => resolveAiFlag(row.id, "cleared"))
                          }
                        >
                          {t("admin.aiMarkClean")}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {overview && overview.failed_jobs.length > 0 && (
        <>
          <h2 className="mt-8 text-[15px] font-semibold">{t("admin.aiFailedTitle")}</h2>
          <div className={`mt-3 ${TABLE_WRAP}`}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>{t("admin.aiColTarget")}</th>
                  <th className={TH}>{t("admin.aiColReason")}</th>
                  <th className={TH}>{t("admin.aiColWhen")}</th>
                  {isSuper && <th className={TH}></th>}
                </tr>
              </thead>
              <tbody>
                {overview.failed_jobs.map((job) => (
                  <tr key={job.id} className="border-b border-line last:border-0">
                    <td className={`${TD} text-sm`}>
                      {job.target_type} · {job.target_id.slice(0, 8)}…
                    </td>
                    <td className={`${TD} max-w-[320px] text-sm text-muted`}>
                      {job.last_error ?? "-"}
                    </td>
                    <td className={`${TD} text-sm whitespace-nowrap text-muted`}>
                      {fmtDateTime(job.created_at)}
                    </td>
                    {isSuper && (
                      <td className={TD}>
                        <button
                          type="button"
                          className={BTN}
                          disabled={busyId === job.id}
                          onClick={() => act(job.id, () => retryAiJob(job.id))}
                        >
                          {t("admin.aiRetry")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">{t("admin.aiVerdictsTitle")}</h2>
        <select
          className={SELECT_CLASS}
          value={decision}
          onChange={(e) => {
            setDecision(e.target.value);
            setPage(1);
          }}
          aria-label={t("admin.aiVerdictsTitle")}
        >
          <option value="all">{t("admin.aiAllDecisions")}</option>
          {Object.keys(DECISION_LABEL).map((key) => (
            <option key={key} value={key}>
              {t(DECISION_LABEL[key])}
            </option>
          ))}
        </select>
      </div>
      <div className={TABLE_WRAP}>
        {!verdicts || verdicts.items.length === 0 ? (
          <EmptyState>{t("admin.aiVerdictsEmpty")}</EmptyState>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={TH}>{t("admin.aiColWhen")}</th>
                <th className={TH}>{t("admin.aiColTarget")}</th>
                <th className={TH}>{t("admin.aiColModel")}</th>
                <th className={TH}>{t("admin.aiColScores")}</th>
                <th className={TH}>{t("admin.aiColDecision")}</th>
                <th className={TH}>{t("admin.aiColReason")}</th>
              </tr>
            </thead>
            <tbody>
              {verdicts.items.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className={`${TD} text-sm whitespace-nowrap text-muted`}>
                    {fmtDateTime(row.created_at)}
                  </td>
                  <td className={TD}>
                    <TargetCell row={row} />
                  </td>
                  <td className={`${TD} max-w-[180px] truncate text-[13px] text-muted`}>
                    {row.model ?? "-"}
                  </td>
                  <td className={TD}>
                    <ScoreSummary row={row} />
                  </td>
                  <td className={TD}>
                    <Pill tone={DECISION_TONE[row.decision] ?? "neutral"}>
                      {t(DECISION_LABEL[row.decision] ?? "admin.aiDecClean")}
                    </Pill>
                  </td>
                  <td className={`${TD} max-w-[280px] text-sm text-muted`}>
                    {row.reason ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {verdicts && (
        <Pagination
          page={page}
          totalPages={verdicts.total_pages}
          total={verdicts.total}
          onPage={setPage}
        />
      )}
    </div>
  );
}
