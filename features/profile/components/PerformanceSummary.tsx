import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { ProfileStats } from "../types";

interface PerformanceSummaryProps {
  /** Canonical person id — the View detail links target its subroutes. */
  personId: string;
  stats: ProfileStats;
}

/**
 * One stat card (Figma 414:822): white fill, hairline border, black
 * icon square + "View detail ›" on the top row, big number, gray label.
 * `href` omitted renders the "View detail" as inert text — Complete
 * Projects is drawn with one in the design but has no prototype link.
 */
function StatCard({
  icon,
  value,
  label,
  href,
}: {
  icon: string;
  value: number;
  label: string;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-surface">
          <Icon name={icon} size={18} solid />
        </span>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-xs font-medium whitespace-nowrap text-ink hover:underline"
          >
            View detail
            <Icon name="chevron-right" size={14} />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium whitespace-nowrap text-ink">
            View detail
            <Icon name="chevron-right" size={14} />
          </span>
        )}
      </div>
      <p className="mt-4 text-4xl leading-none font-extrabold text-ink">{value}</p>
      <p className="mt-1.5 text-sm text-muted">{label}</p>
    </div>
  );
}

/**
 * Right card of the Profile page (Figma 414:822): flat light-gray card
 * holding the three stat cards in a 2 + 1 arrangement (Active Projects
 * spans full width), like the design.
 */
export function PerformanceSummary({ personId, stats }: PerformanceSummaryProps) {
  return (
    <section
      aria-label="Performance summary"
      className="flex w-full shrink-0 flex-col rounded-3xl bg-bg p-6 lg:w-[400px] xl:w-[440px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Performance Summary</h2>
        <button
          type="button"
          aria-label="Performance summary options"
          className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
        >
          <Icon name="dots-horizontal-rounded" size={20} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <StatCard
          icon="check-square"
          value={stats.completeProjects}
          label="Complete Projects"
        />
        <StatCard
          icon="flag"
          value={stats.postFeed}
          label="Post Feed"
          href={`/profile/${personId}/posts`}
        />
        <div className="col-span-2">
          <StatCard
            icon="file"
            value={stats.activeProjects}
            label="Active Projects"
            href={`/profile/${personId}/projects`}
          />
        </div>
      </div>
    </section>
  );
}
