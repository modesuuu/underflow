"use client";

import { setPanelTab, usePanelState } from "../store";
import { ResourcesTab } from "./ResourcesTab";
import { TeamTab } from "./TeamTab";
import type { CircleData } from "../types";

/**
 * The right panel (spec §3, §6): tabbed Team | Resources, 308px like
 * the app's other right rail. Open/close animation is transform and
 * opacity only; the wrapper controls mounting so reversing mid-flight
 * just flips the classes back.
 */
export function CirclePanel({
  projectId,
  data,
  shown,
}: {
  projectId: string;
  data: CircleData;
  shown: boolean;
}) {
  const panel = usePanelState();
  return (
    <aside
      aria-label="Team and resources"
      className={`absolute top-0 right-0 bottom-0 z-30 flex w-[308px] shrink-0 flex-col border-l border-line bg-surface transition-[transform,opacity] duration-[220ms] ease-(--uf-ease-out) xl:static xl:z-auto ${
        shown ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"
      }`}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-3">
        {(
          [
            { id: "team", label: "Team" },
            { id: "resources", label: "Resources" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={panel.tab === tab.id}
            onClick={() => setPanelTab(tab.id)}
            className={`-mb-px cursor-pointer border-b-2 px-2.5 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              panel.tab === tab.id
                ? "border-accent font-medium text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {panel.tab === "team" ? (
          <TeamTab members={data.members} />
        ) : (
          <ResourcesTab projectId={projectId} data={data} />
        )}
      </div>
    </aside>
  );
}
