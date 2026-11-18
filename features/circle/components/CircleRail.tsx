"use client";

import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import type { CircleSummary } from "../types";

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
 * screen. Unread state follows Discord: a short bar on the rail's edge
 * for circles with unread messages (tall bar when active) and a red
 * count badge on the tile. When the user owns projects without a
 * Circle, a dashed plus tile at the bottom opens the create modal.
 */
export function CircleRail({
  circles,
  selectedId,
  onSelect,
  withoutCircle,
  onOpenCreateModal,
}: {
  circles: CircleSummary[];
  selectedId: string | null;
  onSelect: (circleId: string) => void;
  withoutCircle: MyCollabProject[];
  onOpenCreateModal: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="relative flex w-[60px] shrink-0 flex-col border-r border-line bg-bg sm:w-[68px]">
      <nav
        aria-label={t("circle.switcherLabel")}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto py-3"
      >
        {circles.map((circle) => {
          const active = circle.id === selectedId;
          const unread = circle.unreadCount > 0;
          return (
            <button
              key={circle.id}
              type="button"
              title={circle.title}
              aria-label={circle.title}
              aria-current={active || undefined}
              onClick={() => onSelect(circle.id)}
              className="group relative flex w-full shrink-0 cursor-pointer justify-center focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={`absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-all duration-150 ${
                  active
                    ? "h-8"
                    : unread
                      ? "h-2 opacity-100"
                      : "h-2 opacity-0 group-hover:opacity-40"
                }`}
              />
              <span
                className={`relative flex size-11 items-center justify-center rounded-[14px] text-sm font-semibold transition-all duration-150 group-focus-visible:ring-2 group-focus-visible:ring-accent ${
                  active
                    ? "bg-accent text-on-accent"
                    : "border border-line bg-surface text-ink group-hover:border-accent group-hover:text-accent"
                }`}
              >
                {circle.photoProfileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={circle.photoProfileUrl}
                    alt=""
                    className="size-11 rounded-[14px] object-cover"
                  />
                ) : (
                  initialsOf(circle.title)
                )}
                {unread && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -bottom-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-error px-1 text-[10px] leading-none font-bold text-white"
                  >
                    {circle.unreadCount > 99 ? "99+" : circle.unreadCount}
                  </span>
                )}
                {circle.mentionCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-badge px-1 text-[10px] leading-none font-bold text-white"
                  >
                    @
                  </span>
                )}
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
            onClick={onOpenCreateModal}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[14px] border border-dashed border-line bg-surface text-accent transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
