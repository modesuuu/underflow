"use client";

import { Icon } from "@/components/ui/Icon";
import { setPanelOpen, usePanelState } from "../store";
import type { ChannelId } from "../types";

/**
 * Channel header (spec §3, §6): channel name + member count, and the
 * right-panel toggle. The toggle is icon-only with a real pressed
 * state; the panel itself is CirclePanel.
 */
export function ChannelHeader({
  channelId,
  memberCount,
  panelVisible,
}: {
  channelId: ChannelId;
  memberCount: number;
  /** Effective panel visibility (store override or viewport default). */
  panelVisible: boolean;
}) {
  const panel = usePanelState();
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line px-4">
      <h1 className="flex items-baseline gap-1 text-base font-semibold text-ink">
        <span className="text-lg leading-none text-subtle">#</span>
        {channelId}
      </h1>
      <span className="hidden items-center gap-1 text-xs text-subtle sm:flex">
        <Icon name="group" size={14} />
        {memberCount} members
      </span>
      <div className="flex-1" />
      <button
        type="button"
        aria-label={panelVisible ? "Hide team panel" : "Show team panel"}
        aria-pressed={panelVisible}
        onClick={() => setPanelOpen(!panelVisible)}
        className={`flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
          panelVisible ? "bg-bg text-ink" : "text-muted hover:bg-bg hover:text-ink"
        }`}
      >
        <Icon name="layout" size={19} />
      </button>
      <span className="sr-only" aria-live="polite">
        {panel.open === null ? "" : panelVisible ? "Panel open" : "Panel closed"}
      </span>
    </div>
  );
}
