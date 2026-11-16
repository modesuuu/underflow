"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { getApplications } from "../api";
import type { ApplicationRow, ApplicationListStatus } from "../types";
import {
  acceptCollabApplication,
  backendErrorMessage,
  declineCollabApplication,
  withdrawCollabApplication,
} from "@/features/collaborations/api";

/**
 * Central Applications page (audit P1 #12): every application in
 * one place, split by direction. Incoming rows carry the owner's
 * Accept/Decline; outgoing rows carry Withdraw while pending —
 * the same endpoints the inbox cards and ApplyCta already use.
 */

const STATUS_KEY: Record<ApplicationListStatus, DictKey> = {
  pending: "applications.statusPending",
  accepted: "applications.statusAccepted",
  declined: "applications.statusDeclined",
  withdrawn: "applications.statusWithdrawn",
};

const STATUS_STYLE: Record<ApplicationListStatus, React.CSSProperties> = {
  pending: {
    background: "color-mix(in srgb, var(--color-warning, #ffce2f) 22%, transparent)",
    color: "var(--uf-ink)",
  },
  accepted: {
    background: "color-mix(in srgb, var(--color-success, #198100) 14%, transparent)",
    color: "var(--color-success, #198100)",
  },
  declined: {
    background: "color-mix(in srgb, var(--color-error, #c9303a) 12%, transparent)",
    color: "var(--color-error, #c9303a)",
  },
  withdrawn: { background: "var(--uf-bg)", color: "var(--uf-muted)" },
};

type Tab = "incoming" | "outgoing";

export function ApplicationsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("incoming");
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setError(false);
    getApplications(tab)
      .then(setRows)
      .catch(() => setError(true));
  }, [tab, attempt]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const act = async (
    row: ApplicationRow,
    action: "accept" | "decline" | "withdraw",
  ) => {
    setBusyId(row.id);
    try {
      if (action === "accept") {
        await acceptCollabApplication(row.collabId, row.id);
      } else if (action === "decline") {
        await declineCollabApplication(row.collabId, row.id);
      } else {
        await withdrawCollabApplication(row.collabId);
      }
      const next: ApplicationListStatus =
        action === "accept"
          ? "accepted"
          : action === "decline"
            ? "declined"
            : "withdrawn";
      setRows((prev) =>
        prev
          ? prev.map((r) => (r.id === row.id ? { ...r, status: next } : r))
          : prev,
      );
      toast.success(
        t(
          action === "accept"
            ? "applications.acceptedToast"
            : action === "decline"
              ? "applications.declinedToast"
              : "applications.withdrawnToast",
        ),
        { description: row.projectTitle },
      );
    } catch (err) {
      toast.error(t("applications.actionFailed"), {
        description: backendErrorMessage(err),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold text-ink">{t("applications.title")}</h1>
        <p className="text-sm text-muted">{t("applications.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("applications.title")}>
        {(
          [
            { id: "incoming", label: t("applications.tabIncoming") },
            { id: "outgoing", label: t("applications.tabOutgoing") },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
              tab === item.id
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center">
          <p className="text-sm text-muted">{t("applications.loadFailed")}</p>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-3 cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : rows === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[76px] rounded-lg bg-placeholder/60" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-sm text-muted">
          {tab === "incoming"
            ? t("applications.emptyIncoming")
            : t("applications.emptyOutgoing")}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3.5">
              <Avatar size={42} alt={row.other.username} src={row.other.photoUrl} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <Link
                    href={"/profile/" + row.other.id}
                    className="truncate text-[15px] font-medium text-ink hover:underline"
                  >
                    {row.other.username}
                  </Link>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={STATUS_STYLE[row.status]}
                  >
                    {t(STATUS_KEY[row.status])}
                  </span>
                </span>
                <Link
                  href={"/collaborations/" + row.collabId}
                  className="truncate text-sm text-muted hover:underline"
                >
                  {row.projectTitle}
                  {row.dueLabel ? " · " + row.dueLabel : ""}
                </Link>
                {row.message && (
                  <span className="truncate text-[13px] text-subtle" title={row.message}>
                    {row.message}
                  </span>
                )}
              </div>
              <span className="hidden shrink-0 text-[13px] text-subtle sm:block">
                {row.createdLabel}
              </span>
              {row.status === "pending" && row.direction === "incoming" && (
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void act(row, "accept")}
                    className="pressable cursor-pointer rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent disabled:opacity-50"
                  >
                    {t("applications.accept")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void act(row, "decline")}
                    className="pressable cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-50"
                  >
                    {t("applications.decline")}
                  </button>
                </span>
              )}
              {row.status === "pending" && row.direction === "outgoing" && (
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void act(row, "withdraw")}
                  className="pressable shrink-0 cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-50"
                >
                  {t("applications.withdraw")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
