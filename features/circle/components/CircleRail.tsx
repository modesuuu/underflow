"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import type { CircleSummary } from "../types";
import { CreateCircleRows } from "./CreateCircleRows";

/** First initials of a circle title, e.g. "BFF Team" -> "BT". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Circle switcher rail (Circle one-page redesign): the far-left column
 * of squircle tiles, one per circle the user can access. Switching is
 * in-page state, not a route change, so the workspace never leaves the
 * screen. The active tile carries the accent fill plus a bar on the
 * rail's edge. When the user owns projects without a Circle, a dashed
 * plus tile at the bottom opens the create menu for them.
 */
export function CircleRail({
  circles,
  selectedId,
  onSelect,
  withoutCircle,
  creatingId,
  onCreate,
}: {
  circles: CircleSummary[];
  selectedId: string | null;
  onSelect: (circleId: string) => void;
  withoutCircle: MyCollabProject[];
  creatingId: string | null;
  onCreate: (project: MyCollabProject) => void;
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex w-[60px] shrink-0 flex-col border-r border-line bg-bg sm:w-[68px]">
      <nav
        aria-label={t("circle.switcherLabel")}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto py-3"
      >
        {circles.map((circle) => {
          const active = circle.id === selectedId;
          return (
            <button
              key={circle.id}
              type="button"
              title={circle.title}
              aria-label={circle.title}
              aria-current={active || undefined}
              onClick={() => {
                setMenuOpen(false);
                onSelect(circle.id);
              }}
              className="group relative flex w-full shrink-0 cursor-pointer justify-center focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={`absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-all duration-150 ${
                  active ? "h-8" : "h-2 opacity-0 group-hover:opacity-40"
                }`}
              />
              <span
                className={`flex size-11 items-center justify-center rounded-[14px] text-sm font-semibold transition-all duration-150 group-focus-visible:ring-2 group-focus-visible:ring-accent ${
                  active
                    ? "bg-accent text-on-accent"
                    : "border border-line bg-surface text-ink group-hover:border-accent group-hover:text-accent"
                }`}
              >
                {initialsOf(circle.title)}
              </span>
            </button>
          );
        })}
      </nav>
      {withoutCircle.length > 0 && (
        <div className="flex justify-center pt-1 pb-3">
          <button
            type="button"
            aria-label={t("circle.createButton")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex size-11 cursor-pointer items-center justify-center rounded-[14px] border border-dashed transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              menuOpen
                ? "border-accent text-accent"
                : "border-line bg-surface text-accent hover:border-accent"
            }`}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      )}
      {menuOpen && withoutCircle.length > 0 && (
        <>
          <button
            type="button"
            aria-label={t("circle.closeMenu")}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute bottom-3 left-[calc(100%+10px)] z-40 w-[320px] max-w-[calc(100vw-92px)] rounded-2xl border border-line bg-surface p-2 shadow-[0_12px_32px_rgba(20,23,31,0.10)]">
            <p className="px-2 pt-1 pb-1 text-sm font-semibold text-ink">
              {t("circle.withoutCircleTitle")}
            </p>
            <CreateCircleRows
              projects={withoutCircle}
              creatingId={creatingId}
              onCreate={(project) => {
                setMenuOpen(false);
                onCreate(project);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
