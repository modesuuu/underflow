"use client";

import { Icon } from "@/components/ui/Icon";
import type { CircleDetail } from "../types";
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
}: {
  detail: CircleDetail;
  zoneId: string;
  statusLabel: string;
  onSelectZone: (zoneId: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="hidden w-[260px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex flex-col gap-0.5 border-b border-line px-4 py-3.5">
        <span className="line-clamp-2 text-base leading-snug font-semibold text-ink">
          {detail.title}
        </span>
        <span className="text-xs text-muted">{statusLabel}</span>
      </div>
      <span className="px-4 pt-3 pb-1 text-xs font-semibold text-subtle">
        {t("circle.zones")}
      </span>
      <nav
        aria-label={t("circle.zones")}
        className="flex flex-col gap-1 px-2.5 pb-3"
      >
        {detail.zones.map((zone) => {
          const active = zone.id === zoneId;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelectZone(zone.id)}
              aria-current={active ? "page" : undefined}
              className={`flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                active
                  ? "bg-bg font-medium text-ink"
                  : "text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              <span className="text-base leading-none text-subtle">#</span>
              <span className="min-w-0 flex-1 truncate">{zone.title}</span>
              {!zone.memberCanPost && (
                <Icon
                  name="lock"
                  size={13}
                  className="shrink-0 text-subtle"
                />
              )}
            </button>
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
}: {
  detail: CircleDetail;
  zoneId: string;
  onSelectZone: (zoneId: string) => void;
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
            {zone.title}
          </button>
        );
      })}
    </div>
  );
}
