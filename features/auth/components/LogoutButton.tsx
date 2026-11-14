"use client";

import { useState } from "react";
import { logout } from "../api";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Signs out — but only after confirming: an accidental tap used to
 * sign you straight out with no way back. The navigation is left
 * to the RequireAuth gate, which redirects to
 * /login?next=<current page> — the button doing its own replace
 * raced with the gate and the `next` param came out
 * non-deterministic. Rendered on your own profile only.
 */
export function LogoutButton({
  variant = "full",
}: {
  variant?: "full" | "icon";
}) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={t("nav.logOut")}
        title={t("nav.logOut")}
        className={
          variant === "icon"
            ? "flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
            : "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-bg"
        }
      >
        {variant === "icon" ? (
          <Icon name="log-out" size={20} />
        ) : (
          <>
            <Icon name="log-out" size={18} />
            {t("nav.logOut")}
          </>
        )}
      </button>
      {confirming && (
        <ConfirmDialog
          title={t("auth.logOutTitle")}
          description={t("auth.logOutBody")}
          confirmLabel={t("nav.logOut")}
          onConfirm={() => logout()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
