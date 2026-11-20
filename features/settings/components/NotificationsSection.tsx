"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { SettingsSection } from "./SettingsSection";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../api";

/**
 * Notification preferences (audit P1 #14): one switch per
 * category, enforced server-side at creation time. Admin and
 * moderation notices are not in this list — they always arrive.
 */

const ROWS: {
  key: keyof NotificationPreferences;
  label: DictKey;
  desc: DictKey;
}[] = [
  {
    key: "likes",
    label: "settings.notifications.prefLikes",
    desc: "settings.notifications.prefLikesDesc",
  },
  {
    key: "comments",
    label: "settings.notifications.prefComments",
    desc: "settings.notifications.prefCommentsDesc",
  },
  {
    key: "applications",
    label: "settings.notifications.prefApplications",
    desc: "settings.notifications.prefApplicationsDesc",
  },
  {
    key: "collab_status",
    label: "settings.notifications.prefCollabStatus",
    desc: "settings.notifications.prefCollabStatusDesc",
  },
];

export function NotificationsSection() {
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setError(true));
  }, []);

  async function toggle(key: keyof NotificationPreferences) {
    if (!prefs || savingKey) return;
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingKey(key);
    try {
      const saved = await updateNotificationPreferences({
        [key]: next[key],
      } as Partial<NotificationPreferences>);
      setPrefs(saved);
      toast.success(t("settings.notifications.saved"));
    } catch {
      setPrefs(previous);
      toast.error(t("settings.notifications.saveFailed"));
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <SettingsSection
      title={t("settings.notifications.title")}
      description={t("settings.notifications.description")}
    >
      {error ? (
        <p className="text-sm text-error">
          {t("settings.notifications.loadFailed")}
        </p>
      ) : prefs === null ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : (
        <div className="flex flex-col">
          {ROWS.map((row, i) => {
            const on = prefs[row.key];
            return (
              <div
                key={row.key}
                className={
                  "flex items-center justify-between gap-4 py-3 " +
                  (i > 0 ? "border-t border-line" : "")
                }
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-ink">
                    {t(row.label)}
                  </span>
                  <span className="text-[13px] text-muted">
                    {t(row.desc)}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={t(row.label)}
                  disabled={savingKey === row.key}
                  onClick={() => void toggle(row.key)}
                  className={
                    "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50 " +
                    (on ? "bg-accent" : "bg-placeholder")
                  }
                >
                  <span
                    className={
                      "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform " +
                      (on ? "translate-x-5" : "translate-x-0")
                    }
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SettingsSection>
  );
}
