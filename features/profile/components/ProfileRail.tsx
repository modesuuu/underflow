"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useSessionUser } from "@/features/auth/store";
import type { DictKey } from "@/lib/i18n/dictionary";
import { localeTag } from "@/lib/i18n/format";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PersonDetail, ProfileStats, ProfileTab } from "../types";
import { OwnProfileLogout } from "./OwnProfileLogout";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const NAV: { key: ProfileTab; labelKey: DictKey; icon: string; suffix: string }[] = [
  { key: "overview", labelKey: "profile.tabOverview", icon: "user", suffix: "" },
  { key: "posts", labelKey: "profile.tabPosts", icon: "note", suffix: "/posts" },
  { key: "projects", labelKey: "profile.tabProjects", icon: "folder", suffix: "/projects" },
];

/**
 * The GitHub-style profile rail shared by the Overview / Posts /
 * Projects pages: big photo card, name + @username, bio, a vertical
 * nav with real counts, contact rows (socials, email, member since)
 * and the Edit Profile action on your own profile. Sticky on wide
 * screens so the nav stays reachable while the content scrolls.
 */
export function ProfileRail({
  person,
  stats,
  activeTab,
}: {
  person: PersonDetail;
  stats: ProfileStats;
  activeTab: ProfileTab;
}) {
  const { t, lang } = useLanguage();
  const sessionUser = useSessionUser();
  const isOwn =
    person.id === "me" || (sessionUser !== null && sessionUser.id === person.id);
  const base = `/profile/${person.id}`;
  const counts: Record<ProfileTab, number | null> = {
    overview: null,
    posts: stats.postFeed,
    projects: stats.activeProjects + stats.completeProjects,
  };
  const memberSince = person.createdAt
    ? new Intl.DateTimeFormat(localeTag(lang), {
        month: "short",
        year: "numeric",
      }).format(new Date(person.createdAt.replace(" ", "T")))
    : null;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:w-[300px] lg:self-start">
      <div className="w-36 sm:w-44 lg:w-full">
        {person.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.avatarUrl}
            alt={person.name}
            className="aspect-square w-full rounded-3xl object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid aspect-square w-full place-items-center rounded-3xl bg-accent/15 text-6xl font-semibold text-accent"
          >
            {initialsOf(person.name)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold leading-tight text-ink">
          {person.name}
        </h2>
        {person.username && (
          <p className="flex items-center gap-2 text-sm font-medium text-accent">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            @{person.username}
          </p>
        )}
        {person.bio && (
          <p className="whitespace-pre-wrap pt-1 text-sm text-muted">
            {person.bio}
          </p>
        )}
      </div>

      {isOwn && (
        <Link
          href="/settings/profile"
          className="rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          {t("profile.editProfile")}
        </Link>
      )}

      <nav aria-label="Profile" className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.key === activeTab;
          const count = counts[item.key];
          return (
            <Link
              key={item.key}
              href={`${base}${item.suffix}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-2.5 rounded-lg bg-bg px-3 py-2 text-sm font-medium text-ink"
                  : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-ink"
              }
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1">{t(item.labelKey)}</span>
              {count !== null && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {(person.socials?.length || person.email || memberSince) && (
        <ul className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          {person.socials?.map((social) => (
            <li key={social.label}>
              {social.href ? (
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-ink"
                >
                  <i
                    aria-hidden="true"
                    className={`bx bxl-${social.icon} text-[18px] text-accent`}
                  />
                  <span className="truncate">{social.label}</span>
                </a>
              ) : (
                <span className="flex items-center gap-2.5 text-muted">
                  <i
                    aria-hidden="true"
                    className={`bx bxl-${social.icon} text-[18px] text-accent`}
                  />
                  <span className="truncate">{social.label}</span>
                </span>
              )}
            </li>
          ))}
          {person.email && (
            <li>
              <a
                href={`mailto:${person.email}`}
                className="flex items-center gap-2.5 text-muted transition-colors hover:text-ink"
              >
                <Icon name="envelope" size={18} className="text-accent" />
                <span className="truncate">{person.email}</span>
              </a>
            </li>
          )}
          {memberSince && (
            <li className="flex items-center gap-2.5 text-muted">
              <Icon name="calendar" size={18} className="text-accent" />
              <span>{t("profile.memberSince", { date: memberSince })}</span>
            </li>
          )}
        </ul>
      )}

      {person.skills && person.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("admin.sectionSkills")}>
          {person.skills.map((skill) => (
            <li
              key={skill.id}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-on-accent"
            >
              <Icon name="code-curly" size={14} />
              {skill.label}
            </li>
          ))}
        </ul>
      )}

      <OwnProfileLogout personId={person.id} />
    </aside>
  );
}
