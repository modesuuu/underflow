"use client";

import { useSessionUser } from "@/features/auth/store";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SettingsSection } from "./SettingsSection";

/**
 * Account section: the identity facts of the current session,
 * read-only (username and email are set at registration; there
 * is no rename flow), the way the session was established, and
 * Log out — the same confirmed logout the profile page uses.
 * Change password is here too, backed by the real endpoint
 * PUT /api/auth/change-password (audit P0, 2026-11-14).
 */
export function AccountSection() {
  const { t } = useLanguage();
  const user = useSessionUser();

  const rows: { label: string; value: string }[] = user
    ? [
        { label: t("settings.account.username"), value: `@${user.username}` },
        { label: t("settings.account.email"), value: user.email },
        {
          label: t("settings.account.signInMethod"),
          value: user.provider === "google" ? "Google" : t("settings.account.password"),
        },
      ]
    : [];

  return (
    <SettingsSection
      title={t("settings.account.title")}
      description={t("settings.account.description")}
    >
      {user === null ? (
        <p className="text-sm text-muted">{t("settings.account.loading")}</p>
      ) : (
        <>
          <div className="flex flex-col">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={
                  "flex items-center justify-between gap-4 py-2.5 " +
                  (i > 0 ? "border-t border-line" : "")
                }
              >
                <span className="text-sm text-muted">{row.label}</span>
                <span className="truncate text-sm font-medium text-ink">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-4">
            <ChangePasswordForm />
          </div>
          <LogoutButton />
        </>
      )}
    </SettingsSection>
  );
}
