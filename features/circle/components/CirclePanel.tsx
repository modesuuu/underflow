"use client";

import { TeamTab } from "./TeamTab";
import type { CircleMember } from "../types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The right panel (Circle Phase 1): the team list only — resources
 * arrive in a later phase. 308px like the app's other right rail.
 * Open/close animation is transform and opacity only; the wrapper
 * controls mounting so reversing mid-flight just flips classes back.
 */
export function CirclePanel({
  members,
  shown,
}: {
  members: CircleMember[];
  shown: boolean;
}) {
  const { t } = useLanguage();
  return (
    <aside
      aria-label={t("circle.teamTitle")}
      className={`absolute top-0 right-0 bottom-0 z-30 flex w-[308px] shrink-0 flex-col border-l border-line bg-surface transition-[transform,opacity] duration-[220ms] ease-(--uf-ease-out) xl:static xl:z-auto ${
        shown
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-4 opacity-0"
      }`}
    >
      <div className="flex shrink-0 items-center border-b border-line px-4 py-3">
        <span className="text-sm font-medium text-ink">
          {t("circle.teamTitle")}
        </span>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <TeamTab members={members} />
      </div>
    </aside>
  );
}
