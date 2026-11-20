"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useSessionUser } from "@/features/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PersonDetail } from "../types";
import { ProfileMarkdown } from "./ProfileMarkdown";

/**
 * The Profile Detail card at the top of the profile Overview: the
 * person's long-form markdown text (edited in Settings → Profile).
 * Renders nothing when the person has not written one.
 */
export function ProfileDetailCard({ person }: { person: PersonDetail }) {
  const { t } = useLanguage();
  const sessionUser = useSessionUser();
  const detail = person.profileDetail?.trim();
  if (!detail) return null;
  const isOwn =
    person.id === "me" || (sessionUser !== null && sessionUser.id === person.id);

  return (
    <section
      aria-label={t("profile.profileDetail")}
      className="flex flex-col gap-4 rounded-2xl bg-bg p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium text-ink">
          {t("profile.profileDetail")}
        </h3>
        {isOwn && (
          <Link
            href="/settings/profile"
            aria-label={t("profile.editProfile")}
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <Icon name="pencil" size={16} />
          </Link>
        )}
      </div>
      <ProfileMarkdown source={detail} />
    </section>
  );
}
