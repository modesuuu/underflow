"use client";

import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { skillIconName } from "@/lib/skill-icon";
import type { PersonDetail } from "../types";

/**
 * Skills section on the profile Overview (right column): the skills
 * the person chose to show on their profile, rendered as the same
 * accent chips the rail uses. Renders nothing when the person has
 * no profile skills.
 */
export function ProfileSkills({ person }: { person: PersonDetail }) {
  const { t } = useLanguage();
  if (!person.skills || person.skills.length === 0) return null;

  return (
    <section
      aria-label={t("profile.skillsHeading")}
      className="flex flex-col gap-4 p-5"
    >
      <h3 className="text-lg font-medium text-ink">
        {t("profile.skillsHeading")}
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {person.skills.map((skill) => (
          <li
            key={skill.id}
            className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-on-accent"
          >
            <Icon name={skillIconName(skill.label)} size={14} />
            {skill.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
