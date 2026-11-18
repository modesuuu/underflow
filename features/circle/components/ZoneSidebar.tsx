"use client";

import { Icon } from "@/components/ui/Icon";
import type { CircleDetail, CircleZone } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Zone column (Circle Phase 1, one-page redesign): project title +
 * status on top, then the zones as data rows from the backend. A lock
 * marks zones the current user cannot post in (announcements for
 * members). Switching zones is in-page state via onSelectZone, not a
 * route change. Below lg the column collapses into the ZoneSwitcher
 * pill row.
 */
export function ZoneSidebar({
  detail,
  zoneId,
  statusLabel,
  onSelectZone,
  isOwner,
  onCreateZone,
  onZoneSettings,
  onOpenCircleSettings,
}: {
  detail: CircleDetail;
  zoneId: string;
  statusLabel: string;
  onSelectZone: (zoneId: string) => void;
  isOwner: boolean;
  onCreateZone: () => void;
  onZoneSettings: (zone: CircleZone) => void;
  onOpenCircleSettings: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="hidden w-[260px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 text-lg leading-snug font-semibold text-ink">
            {detail.title}
          </span>
          <span className="text-xs text-muted">{statusLabel}</span>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={onOpenCircleSettings}
            aria-label={t("circle.openCircleSettings")}
            title={t("circle.openCircleSettings")}
            className="mt-0.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="slider" size={17} />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-semibold text-subtle">
          {t("circle.zones")}
        </span>
        {isOwner && (
          <button
            type="button"
            onClick={onCreateZone}
            aria-label={t("circle.addZone")}
            title={t("circle.addZone")}
            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="plus" size={15} />
          </button>
        )}
      </div>
      <nav
        aria-label={t("circle.zones")}
        className="flex flex-col gap-1 px-2.5 pb-3"
      >
        {detail.zones.map((zone) => {
          const active = zone.id === zoneId;
          return (
            <div key={zone.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelectZone(zone.id)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  isOwner ? "pr-9" : ""
                } ${
                  active
                    ? "bg-bg font-medium text-ink"
                    : "text-muted hover:bg-bg hover:text-ink"
                }`}
              >
                {zone.unreadCount > 0 && !active ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                ) : null}
                <span className="text-base leading-none text-subtle">#</span>
                <span
                  className={`min-w-0 flex-1 truncate ${
                    zone.unreadCount > 0 && !active
                      ? "font-semibold text-ink"
                      : ""
                  }`}
                >
                  {zone.title}
                </span>
                {!zone.memberCanPost && (
                  <Icon
                    name="lock"
                    size={13}
                    className="shrink-0 text-subtle"
                  />
                )}
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onZoneSettings(zone)}
                  aria-label={t("circle.openZoneSettings")}
                  title={t("circle.openZoneSettings")}
                  className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-line/50 hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="cog" size={15} />
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function ZoneSwitcher({
  detail,
  zoneId,
  onSelectZone,
  isOwner,
  onCreateZone,
}: {
  detail: CircleDetail;
  zoneId: string;
  onSelectZone: (zoneId: string) => void;
  isOwner: boolean;
  onCreateZone: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 lg:hidden"
      role="navigation"
      aria-label={t("circle.zones")}
    >
      {detail.zones.map((zone) => {
        const active = zone.id === zoneId;
        return (
          <button
            key={zone.id}
            type="button"
            onClick={() => onSelectZone(zone.id)}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              active
                ? "bg-accent font-medium text-on-accent"
                : "bg-bg text-muted hover:text-ink"
            }`}
          >
            <span className="leading-none">#</span>
            {zone.unreadCount > 0 && !active ? (
              <span className="size-1.5 shrink-0 rounded-full bg-accent" />
            ) : null}
            <span
              className={
                zone.unreadCount > 0 && !active ? "font-semibold text-ink" : ""
              }
            >
              {zone.title}
            </span>
          </button>
        );
      })}
      {isOwner && (
        <button
          type="button"
          onClick={onCreateZone}
          aria-label={t("circle.addZone")}
          title={t("circle.addZone")}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bg text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Icon name="plus" size={16} />
        </button>
      )}
    </div>
  );
}
