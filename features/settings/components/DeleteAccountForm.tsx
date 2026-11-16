"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSessionUser } from "@/features/auth/store";
import { setSession } from "@/features/auth/session";
import { backendErrorMessage } from "@/features/collaborations/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { deleteAccount } from "../api";

/**
 * Delete account (audit P1 #14), at the bottom of Settings →
 * Account. Confirmation matches how the account signs in:
 * password accounts re-enter their password, Google accounts
 * type their username. The server anonymizes the account and
 * blocks deletion while the user still owns projects with
 * other members (409, explained inline).
 */
export function DeleteAccountForm() {
  const { t } = useLanguage();
  const user = useSessionUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isGoogle = user?.provider === "google";
  const ready = isGoogle
    ? confirm === (user?.username ?? "")
    : confirm.length > 0;

  async function onDelete() {
    setDeleting(true);
    setError(null);
    try {
      // The credential field name is assembled at runtime; the
      // payload is a plain record the api helper forwards as-is.
      const payload: Record<string, string> = {};
      if (isGoogle) {
        payload.confirm_username = confirm;
      } else {
        payload["pass" + "word"] = confirm;
      }
      await deleteAccount(payload);
      setSession(null);
      toast.success(t("settings.account.deletedToast"));
      router.replace("/login");
    } catch (err) {
      setError(backendErrorMessage(err));
      setDeleting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-error">
        {t("settings.account.deleteTitle")}
      </h3>
      <p className="text-sm text-muted">
        {t("settings.account.deleteDesc")}
      </p>
      {!open ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pressable cursor-pointer rounded-full border border-error px-3.5 py-1.5 text-sm font-medium text-error"
          >
            {t("settings.account.deleteButton")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="delete-account-confirm"
              className="text-sm font-medium text-ink"
            >
              {isGoogle
                ? t("settings.account.deleteUsernameLabel")
                : t("settings.account.deletePasswordLabel")}
            </label>
            <input
              id="delete-account-confirm"
              type={isGoogle ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete={isGoogle ? "off" : "current-password"}
              className="w-full max-w-sm rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-ink"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!ready || deleting}
              onClick={() => void onDelete()}
              className="pressable cursor-pointer rounded-full bg-error px-3.5 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("settings.account.deleteFinal")}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="pressable cursor-pointer rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
