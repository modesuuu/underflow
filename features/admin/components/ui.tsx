"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Shared admin UI bits (spec-admin.md §7): dense, quiet, table-first.
 * Semantic pills use inline styles on theme vars so they survive
 * both themes without depending on generated utility classes.
 */

export function Pill({
  tone,
  children,
}: {
  tone: "neutral" | "success" | "danger" | "warning";
  children: ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { background: "var(--uf-bg)", color: "var(--uf-muted)" },
    success: {
      background: "color-mix(in srgb, var(--color-success, #198100) 14%, transparent)",
      color: "var(--color-success, #198100)",
    },
    danger: {
      background: "color-mix(in srgb, var(--color-error, #c9303a) 12%, transparent)",
      color: "var(--color-error, #c9303a)",
    },
    warning: {
      background: "color-mix(in srgb, var(--color-warning, #ffce2f) 22%, transparent)",
      color: "var(--uf-ink)",
    },
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}

export function RoleLabel({ role }: { role: string }) {
  const { t } = useLanguage();
  if (role === "super_admin") return <Pill tone="warning">{t("admin.superAdmin")}</Pill>;
  if (role === "monitor") return <Pill tone="neutral">{t("admin.monitor")}</Pill>;
  return <span className="text-muted">{t("admin.user")}</span>;
}

export function ModerationPill({ state }: { state: "visible" | "removed" }) {
  const { t } = useLanguage();
  return state === "removed" ? (
    <Pill tone="danger">{t("admin.removed")}</Pill>
  ) : (
    <Pill tone="success">{t("admin.visible")}</Pill>
  );
}

export function AccountPill({ status }: { status: "active" | "suspended" }) {
  const { t } = useLanguage();
  return status === "suspended" ? (
    <Pill tone="danger">{t("admin.suspended")}</Pill>
  ) : (
    <Pill tone="success">{t("admin.active")}</Pill>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const { t } = useLanguage();
  if (total === 0) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>
        {total === 1
          ? t("admin.paginationOne", { total, page, pages: totalPages })
          : t("admin.paginationMany", { total, page, pages: totalPages })}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-ink disabled:cursor-default disabled:opacity-40"
        >
          {t("admin.previous")}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-ink disabled:cursor-default disabled:opacity-40"
        >
          {t("admin.next")}
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center">
      <p className="text-sm text-muted">{t("admin.couldntLoadData")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

export const TABLE_WRAP = "overflow-x-auto rounded-lg border border-line bg-surface";
export const TH = "px-3 py-2.5 text-left text-xs font-medium tracking-wide text-subtle uppercase";
export const TD = "px-3 py-3 align-middle";
