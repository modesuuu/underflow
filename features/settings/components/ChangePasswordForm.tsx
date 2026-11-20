"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { changePassword } from "@/features/auth/api";
import { useSessionUser } from "@/features/auth/store";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/validation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Change-password form for Settings → Account (audit P0, 2026-11-14).
 * Backed by PUT /api/auth/change-password: the server verifies the
 * current password before storing the new hash. Google-only sessions
 * have no password to change (their hash is a random unknown value),
 * so they get an explanatory note instead of a dead form.
 */
export function ChangePasswordForm() {
  const { t } = useLanguage();
  const user = useSessionUser();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  if (user?.provider === "google") {
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-ink">{t("settings.password.title")}</h3>
        <p className="text-sm text-muted">{t("settings.password.googleNote")}</p>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!current || !next || !confirm) {
      toast.error(t("auth.errPasswordRequired"));
      return;
    }
    if (next.length < MIN_PASSWORD_LENGTH) {
      toast.error(t("auth.errPasswordLength"));
      return;
    }
    if (next !== confirm) {
      toast.error(t("settings.password.mismatch"));
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(t("settings.password.success"));
    } catch (err) {
      // Client-side checks above leave one realistic 400: the
      // current password did not match.
      if (err instanceof ApiError && err.status === 400) {
        toast.error(t("settings.password.wrongCurrent"));
      } else {
        toast.error(t("settings.password.failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-subtle focus:border-accent";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-ink">{t("settings.password.title")}</h3>
        <p className="text-sm text-muted">{t("settings.password.description")}</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{t("settings.password.current")}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{t("settings.password.new")}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{t("settings.password.confirm")}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </label>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="pressable cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity disabled:cursor-wait disabled:opacity-60"
        >
          {t("settings.password.submit")}
        </button>
      </div>
    </form>
  );
}
