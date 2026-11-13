"use client";

import { useSessionUser } from "@/features/auth/store";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { SettingsSection } from "./SettingsSection";

/**
 * Account section: the identity facts of the current session,
 * read-only (username and email are set at registration; there
 * is no rename flow), the way the session was established, and
 * Log out — the same confirmed logout the profile page uses.
 * Password changes are deliberately absent: the backend has no
 * change-password endpoint yet, so the control would be a fake.
 */
export function AccountSection() {
  const user = useSessionUser();

  const rows: { label: string; value: string }[] = user
    ? [
        { label: "Username", value: `@${user.username}` },
        { label: "Email", value: user.email },
        {
          label: "Sign-in method",
          value: user.provider === "google" ? "Google" : "Password",
        },
      ]
    : [];

  return (
    <SettingsSection
      title="Account"
      description="The account you are signed in with."
    >
      {user === null ? (
        <p className="text-sm text-muted">Loading your account…</p>
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
          <LogoutButton />
        </>
      )}
    </SettingsSection>
  );
}
