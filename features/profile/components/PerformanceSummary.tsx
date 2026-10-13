import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { ProfileStats } from "../types";

interface PerformanceSummaryProps {
  /** Canonical person id — the View detail links target its subroutes. */
  personId: string;
  stats: ProfileStats;
}

/**
 * Right card of the Profile page (Figma 414:822 "Performance Summary").
 * The prototype connects only Post Feed and Active Projects, so Complete
 * Projects renders its "View detail" as inert text — no link is invented.
 */
export function PerformanceSummary({ personId, stats }: PerformanceSummaryProps) {
  return (
    <section
      aria-label="Performance summary"
      className="flex flex-col rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Performance Summary</h2>
        <button
          type="button"
          aria-label="Performance summary options"
          className="flex size-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-bg hover:text-ink"
        >
          <Icon name="dots-horizontal-rounded" size={20} />
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-bg p-4">
          <p className="text-[28px] leading-none font-extrabold text-ink">
            {stats.completeProjects}
          </p>
          <p className="mt-2 text-[13px] text-ink/60">Complete Projects</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-ink/40">
            View detail
          </span>
        </div>

        <div className="rounded-xl bg-bg p-4">
          <p className="text-[28px] leading-none font-extrabold text-ink">
            {stats.postFeed}
          </p>
          <p className="mt-2 text-[13px] text-ink/60">Post Feed</p>
          <Link
            href={`/profile/${personId}/posts`}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-ink hover:underline"
          >
            View detail
            <Icon name="right-arrow-alt" size={14} />
          </Link>
        </div>

        <div className="rounded-xl bg-bg p-4">
          <p className="text-[28px] leading-none font-extrabold text-ink">
            {stats.activeProjects}
          </p>
          <p className="mt-2 text-[13px] text-ink/60">Active Projects</p>
          <Link
            href={`/profile/${personId}/projects`}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-ink hover:underline"
          >
            View detail
            <Icon name="right-arrow-alt" size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
