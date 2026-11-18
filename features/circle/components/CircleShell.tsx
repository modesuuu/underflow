"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { setPanelOpen, usePanelState } from "../store";
import { ZoneHeader } from "./ZoneHeader";
import { ZoneSidebar, ZoneSwitcher } from "./ZoneSidebar";
import { CirclePanel } from "./CirclePanel";
import type { CircleDetail } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The Circle shell (Circle Phase 1): zone rail, zone column,
 * collapsible right panel. Below 1280px the panel becomes an overlay
 * from the right; below lg the zone rail becomes a switcher row.
 * Panel visibility: the store override wins, otherwise open at
 * >=1280px. The zone body is an empty state — messaging endpoints
 * land in Phase 2, so there is no timeline and no composer yet.
 */
export function CircleShell({
  detail,
  zoneId,
  statusLabel,
}: {
  detail: CircleDetail;
  zoneId: string;
  statusLabel: string;
}) {
  const { t } = useLanguage();
  const panel = usePanelState();
  const [isWide, setIsWide] = useState(false);
  const [renderPanel, setRenderPanel] = useState(false);
  const [panelShown, setPanelShown] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const apply = () => setIsWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const panelVisible = panel.open ?? isWide;

  useEffect(() => {
    if (panelVisible) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setRenderPanel(true);
      const raf = requestAnimationFrame(() => setPanelShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setPanelShown(false);
    closeTimer.current = setTimeout(() => setRenderPanel(false), 230);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [panelVisible]);

  const zone = detail.zones.find((z) => z.id === zoneId) ?? detail.zones[0];

  return (
    <div className="relative flex min-h-0 flex-1">
      <ZoneSidebar detail={detail} zoneId={zone.id} statusLabel={statusLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ZoneHeader
          zoneTitle={zone.title}
          memberCount={detail.members.length}
          panelVisible={panelVisible}
        />
        <ZoneSwitcher detail={detail} zoneId={zone.id} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-bg text-subtle">
            <Icon name="conversation" size={22} />
          </span>
          <p className="text-base font-medium text-ink">
            {t("circle.zoneEmptyTitle", { zone: zone.title })}
          </p>
          <p className="max-w-sm text-sm text-muted">
            {zone.title === "announcements"
              ? t("circle.zoneEmptyAnnouncements")
              : t("circle.zoneEmptyGeneral")}
          </p>
          {!zone.memberCanPost && (
            <p className="flex items-center gap-1.5 text-xs text-subtle">
              <Icon name="lock" size={12} />
              {t("circle.zoneReadOnly")}
            </p>
          )}
        </div>
      </div>
      {renderPanel && (
        <>
          {!isWide && (
            <button
              type="button"
              aria-label={t("circle.closePanel")}
              onClick={() => setPanelOpen(false)}
              className="absolute inset-0 z-20 cursor-default bg-ink/40 xl:hidden"
            />
          )}
          <CirclePanel members={detail.members} shown={panelShown} />
        </>
      )}
    </div>
  );
}
