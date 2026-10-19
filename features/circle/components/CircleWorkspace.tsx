"use client";

import { useEffect, useRef, useState } from "react";
import { setPanelOpen, useCircle, usePanelState } from "../store";
import { ChannelHeader } from "./ChannelHeader";
import { ChannelSidebar, ChannelSwitcher } from "./ChannelSidebar";
import { CirclePanel } from "./CirclePanel";
import { Composer } from "./Composer";
import { MessageTimeline } from "./MessageTimeline";
import type { ChannelId } from "../types";

/**
 * The Circle workspace shell (spec §3): channel rail, timeline column,
 * collapsible right panel. Below 1280px the panel becomes an overlay
 * from the right; below lg the channel rail becomes a switcher row.
 * Panel visibility: the store override wins, otherwise open at >=1280px.
 */
export function CircleWorkspace({
  projectId,
  channelId,
  title,
  statusLabel,
}: {
  projectId: string;
  channelId: ChannelId;
  title: string;
  statusLabel: string;
}) {
  const data = useCircle(projectId);
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

  if (!data) return null;

  const me = data.members.find((m) => m.userId === "me");
  const canPost = channelId === "general" || Boolean(me?.isOwner);

  return (
    <div className="relative flex min-h-0 flex-1">
      <ChannelSidebar
        projectId={projectId}
        title={title}
        statusLabel={statusLabel}
        channelId={channelId}
        data={data}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <ChannelHeader
          channelId={channelId}
          memberCount={data.members.length}
          panelVisible={panelVisible}
        />
        <ChannelSwitcher projectId={projectId} channelId={channelId} data={data} />
        <MessageTimeline
          key={channelId}
          projectId={projectId}
          channelId={channelId}
          data={data}
        />
        <Composer projectId={projectId} channelId={channelId} canPost={canPost} />
      </div>
      {renderPanel && (
        <>
          {!isWide && (
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setPanelOpen(false)}
              className="absolute inset-0 z-20 cursor-default bg-ink/40 xl:hidden"
            />
          )}
          <CirclePanel projectId={projectId} data={data} shown={panelShown} />
        </>
      )}
    </div>
  );
}
