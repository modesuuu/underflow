"use client";

import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PersonDetail } from "../types";
import { OwnProfileLogout } from "./OwnProfileLogout";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
        <Icon name={icon} size={16} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="truncate text-sm font-medium text-ink">{value}</span>
      </div>
    </div>
  );
}

/**
 * The About card under the stats band on the profile Overview:
 * the Detail Information rows that used to live in the old left
 * card, laid out in a row on wide screens. The Log out slot for
 * your own profile stays at the bottom.
 */
export function ProfileAboutCard({ person }: { person: PersonDetail }) {
  const { t } = useLanguage();
  return (
    <section
      aria-label={t("profile.detailInformation")}
      className="flex flex-col gap-5 rounded-3xl bg-bg p-5"
    >
      <h3 className="text-lg font-medium text-ink">
        {t("profile.detailInformation")}
      </h3>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-12">
        <InfoRow icon="user" label={t("profile.fullName")} value={person.name} />
        {person.email && (
          <InfoRow
            icon="envelope"
            label={t("settings.account.email")}
            value={person.email}
          />
        )}
        {person.username && (
          <InfoRow
            icon="at"
            label={t("settings.account.username")}
            value={`@${person.username}`}
          />
        )}
      </div>
      <OwnProfileLogout personId={person.id} />
    </section>
  );
}
