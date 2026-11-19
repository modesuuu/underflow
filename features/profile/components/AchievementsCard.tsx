"use client";

import { Icon } from "@/components/ui/Icon";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PersonDetail, ProfileStats, UserActivity } from "../types";

interface Badge {
  icon: string;
  nameKey: DictKey;
  descKey: DictKey;
  earned: boolean;
}

/**
 * Milestone badges for the profile Overview, computed from real
 * data only: post counts, project membership and ownership (from
 * the activity totals), completed projects, and listed skills.
 * Unearned badges stay visible in a muted state with their
 * requirement as the description.
 */
export function AchievementsCard({
  person,
  stats,
  activity,
}: {
  person: PersonDetail;
  stats: ProfileStats;
  activity: UserActivity | null;
}) {
  const { t } = useLanguage();
  const badges: Badge[] = [
    {
      icon: "edit-alt",
      nameKey: "profile.badgeFirstPost",
      descKey: "profile.badgeFirstPostDesc",
      earned: stats.postFeed >= 1,
    },
    {
      icon: "megaphone",
      nameKey: "profile.badgeVoice",
      descKey: "profile.badgeVoiceDesc",
      earned: stats.postFeed >= 10,
    },
    {
      icon: "group",
      nameKey: "profile.badgeCollaborator",
      descKey: "profile.badgeCollaboratorDesc",
      earned: activity
        ? activity.totals.projectsJoined >= 1
        : stats.activeProjects + stats.completeProjects >= 1,
    },
    {
      icon: "crown",
      nameKey: "profile.badgeOwner",
      descKey: "profile.badgeOwnerDesc",
      earned: activity ? activity.totals.projectsCreated >= 1 : false,
    },
    {
      icon: "badge-check",
      nameKey: "profile.badgeFinisher",
      descKey: "profile.badgeFinisherDesc",
      earned: stats.completeProjects >= 1,
    },
    {
      icon: "layer",
      nameKey: "profile.badgeAllRounder",
      descKey: "profile.badgeAllRounderDesc",
      earned: (person.skills?.length ?? 0) >= 5,
    },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section
      aria-label={t("profile.achievements")}
      className="flex flex-col gap-4 rounded-3xl bg-bg p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium text-ink">
          {t("profile.achievements")}
        </h3>
        <span className="text-sm text-muted">
          {t("profile.achievementCount", {
            earned: earnedCount,
            total: badges.length,
          })}
        </span>
      </div>
      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {badges.map((badge) => (
          <li
            key={badge.nameKey}
            className={`flex items-center gap-3 ${badge.earned ? "" : "opacity-60"}`}
          >
            <span
              className={
                badge.earned
                  ? "grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent"
                  : "grid size-11 shrink-0 place-items-center rounded-full bg-surface text-muted"
              }
            >
              <Icon name={badge.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                className={`text-sm font-medium ${badge.earned ? "text-ink" : "text-muted"}`}
              >
                {t(badge.nameKey)}
              </span>
              <span className="text-xs text-muted">{t(badge.descKey)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
