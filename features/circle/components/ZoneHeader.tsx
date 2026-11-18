"use client";

import { Icon } from "@/components/ui/Icon";
import { setPanelOpen, usePanelState } from "../store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Zone header (Circle Phase 1): zone name + member count, and the
 * right-panel toggle. The toggle is icon-only with a real pressed
 * state; the panel itself is CirclePanel.
 */
/**
 * Hover label for the header icon buttons: an in-page tooltip
 * anchored to the button's right edge, so it grows leftward and
 * can never spill past the right edge of the window (the native
 * title tooltip did exactly that and rendered cut off).
 */
const TOOLTIP_CLASS =
  "pointer-events-none absolute top-full right-0 z-30 mt-1.5 hidden rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium whitespace-nowrap text-ink shadow-lg group-hover:block group-focus-within:block";

export function ZoneHeader({
  zoneTitle,
  memberCount,
  panelVisible,
  isOwner,
  onZoneSettings,
  onOpenCircleSettings,
}: {
  zoneTitle: string;
  memberCount: number;
  /** Effective panel visibility (store override or viewport default). */
  panelVisible: boolean;
  isOwner?: boolean;
  onZoneSettings?: () => void;
  onOpenCircleSettings?: () => void;
}) {
  const { t } = useLanguage();
  const panel = usePanelState();
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line px-4">
      <h1 className="flex items-baseline gap-1 text-base font-semibold text-ink">
        <span className="text-lg leading-none text-subtle">#</span>
        {zoneTitle}
      </h1>
      <span className="hidden items-center gap-1 text-xs text-subtle sm:flex">
        <Icon name="group" size={14} />
        {t("circle.membersCount", { count: memberCount })}
      </span>
      <div className="flex-1" />
      {isOwner && (
        <>
          <span className="group relative flex">
            <button
              type="button"
              aria-label={t("circle.openZoneSettings")}
              onClick={onZoneSettings}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="cog" size={18} />
            </button>
            <span aria-hidden="true" className={TOOLTIP_CLASS}>
              {t("circle.openZoneSettings")}
            </span>
          </span>
          <span className="group relative flex">
            <button
              type="button"
              aria-label={t("circle.openCircleSettings")}
              onClick={onOpenCircleSettings}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="slider" size={18} />
            </button>
            <span aria-hidden="true" className={TOOLTIP_CLASS}>
              {t("circle.openCircleSettings")}
            </span>
          </span>
        </>
      )}
      <span className="group relative flex">
        <button
          type="button"
          aria-label={
            panelVisible ? t("circle.hidePanel") : t("circle.showPanel")
          }
          aria-pressed={panelVisible}
          onClick={() => setPanelOpen(!panelVisible)}
          className={`flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            panelVisible
              ? "bg-bg text-ink"
              : "text-muted hover:bg-bg hover:text-ink"
          }`}
        >
          <Icon name="layout" size={19} />
        </button>
        <span aria-hidden="true" className={TOOLTIP_CLASS}>
          {panelVisible ? t("circle.hidePanel") : t("circle.showPanel")}
        </span>
      </span>
      <span className="sr-only" aria-live="polite">
        {panel.open === null
          ? ""
          : panelVisible
            ? "Panel open"
            : "Panel closed"}
      </span>
    </div>
  );
}
