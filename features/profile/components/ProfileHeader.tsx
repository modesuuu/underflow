"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useSessionUser } from "@/features/auth/store";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PersonDetail } from "../types";

export type ProfileTab = "overview" | "posts" | "projects";

const TABS: { key: ProfileTab; labelKey: DictKey; icon: string; suffix: string }[] = [
  { key: "overview", labelKey: "profile.tabOverview", icon: "user", suffix: "" },
  { key: "posts", labelKey: "profile.tabPosts", icon: "note", suffix: "/posts" },
  { key: "projects", labelKey: "profile.tabProjects", icon: "folder", suffix: "/projects" },
];

/**
 * Shared profile header for the Overview / Posts / Projects pages:
 * large photo with a camera shortcut on your own profile, name,
 * @username line with the top skill, bio, socials and skill chips,
 * then the segmented tab bar (active tab is a white pill) with an
 * Edit Profile action on your own profile. Layout follows the
 * reference the user picked; colors stay on the app tokens.
 */
export function ProfileHeader({
  person,
  activeTab,
}: {
  person: PersonDetail;
  activeTab: ProfileTab;
}) {
  const { t } = useLanguage();
  const sessionUser = useSessionUser();
  const isOwn =
    person.id === "me" || (sessionUser !== null && sessionUser.id === person.id);
  const base = `/profile/${person.id}`;
  const topSkill = person.skills?.[0]?.label;

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0 self-start">
          <Avatar
            src={person.avatarUrl ?? undefined}
            alt={person.name}
            size={112}
          />
          {isOwn && (
            <Link
              href="/settings/profile"
              aria-label={t("profile.editProfile")}
              title={t("profile.editProfile")}
              className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-accent text-on-accent ring-4 ring-surface transition-transform hover:scale-105"
            >
              <Icon name="camera" size={16} />
            </Link>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="text-[28px] font-semibold leading-tight text-ink">
            {person.name}
          </h2>
          {(person.username || topSkill) && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {person.username && (
                <span className="flex items-center gap-2 font-medium text-accent">
                  <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
                  @{person.username}
                </span>
              )}
              {topSkill && (
                <span className="text-muted">
                  {person.username ? "· " : ""}
                  {topSkill}
                </span>
              )}
            </p>
          )}
          {person.bio && (
            <p className="max-w-xl whitespace-pre-wrap text-sm text-muted">
              {person.bio}
            </p>
          )}

          {person.socials && person.socials.length > 0 && (
            <ul className="flex items-center gap-1.5 pt-1" aria-label={t("profile.socialLinks")}>
              {person.socials.map((social) => (
                <li key={social.label}>
                  {social.href ? (
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      title={social.label}
                      className="flex size-8 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85"
                    >
                      <i aria-hidden="true" className={`bx bxl-${social.icon} text-[18px]`} />
                    </a>
                  ) : (
                    <span
                      title={social.label}
                      className="flex size-8 items-center justify-center rounded-full bg-accent text-on-accent"
                    >
                      <i aria-hidden="true" className={`bx bxl-${social.icon} text-[18px]`} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {person.skills && person.skills.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1" aria-label={t("admin.sectionSkills")}>
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
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Profile" className="flex items-center gap-1 rounded-full bg-bg p-1">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={`${base}${tab.suffix}`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-ink shadow-sm"
                    : "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
                }
              >
                <Icon name={tab.icon} size={15} />
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </nav>
        {isOwn && (
          <Link
            href="/settings/profile"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            {t("profile.editProfile")}
          </Link>
        )}
      </div>
    </header>
  );
}
