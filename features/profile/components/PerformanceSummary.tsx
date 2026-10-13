import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { ProfileStats } from "../types";
import { FileCodeIcon, FolderCheckIcon, NoteIcon } from "./StatIcons";

interface PerformanceSummaryProps {
  /** Canonical person id — the View detail links target its subroutes. */
  personId: string;
  stats: ProfileStats;
}

/**
 * One stat card, values taken from Figma 414:822 exactly: transparent
 * fill, 1px border in --uf-line (#6d6c6a), 12px radius, 12px padding,
 * 24px custom tile icon + Medium 12px "View detail" with a 16px
 * chevron on the top row, then Medium 24px number and Medium 14px
 * --uf-line label. `href` omitted renders "View detail" as inert text
 * — the design's own structure does the same for Complete Projects
 * (its prototype has no destination).
 */
function StatCard({
  icon,
  value,
  label,
  href,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  href?: string;
}) {
  const viewDetail = (
    <>
      View detail
      <Icon name="chevron-right" size={16} />
    </>
  );
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        {icon}
        {href ? (
          <Link
            href={href}
            className="flex items-center text-xs font-medium whitespace-nowrap text-ink hover:underline"
          >
            {viewDetail}
          </Link>
        ) : (
          <span className="flex items-center text-xs font-medium whitespace-nowrap text-ink">
            {viewDetail}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-2xl font-medium text-ink">{value}</p>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

/**
 * Right card of the Profile page (Figma 414:822): flat light-gray card,
 * Medium 20px title, three stat cards in the frame's 2 + 1 arrangement
 * (Active Projects spans full width).
 */
export function PerformanceSummary({ personId, stats }: PerformanceSummaryProps) {
  return (
    <section
      aria-label="Performance summary"
      className="flex w-full shrink-0 flex-col gap-6 rounded-3xl bg-bg p-6 lg:w-[397px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-ink">Performance Summary</h2>
        <button
          type="button"
          aria-label="Performance summary options"
          className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
        >
          <Icon name="dots-horizontal-rounded" size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex gap-5">
          <div className="flex flex-1">
            <StatCard
              icon={<FolderCheckIcon />}
              value={stats.completeProjects}
              label="Complete Projects"
            />
          </div>
          <div className="flex flex-1">
            <StatCard
              icon={<NoteIcon />}
              value={stats.postFeed}
              label="Post Feed"
              href={`/profile/${personId}/posts`}
            />
          </div>
        </div>
        <StatCard
          icon={<FileCodeIcon />}
          value={stats.activeProjects}
          label="Active Projects"
          href={`/profile/${personId}/projects`}
        />
      </div>
    </section>
  );
}
