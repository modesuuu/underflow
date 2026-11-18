"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { backendErrorMessage } from "@/features/collaborations/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { deleteZone, updateZone } from "../api";
import type { CircleZone } from "../types";

type Tab = "overview" | "permissions" | "delete";

/**
 * Zone settings (Circle settings, Discord Channel Settings
 * pattern): left tabs Overview / Permissions, Delete Zone in red at
 * the bottom of the tab list, and a save bar that only appears while
 * the form is dirty (Reset / Save Changes). The permissions tab is
 * the one real permission Circle has: who can post, backed by the
 * zone's allow_public_message flag.
 */
export function ZoneSettingsModal({
  circleId,
  zone,
  canDelete,
  onClose,
  onSaved,
  onDeleted,
}: {
  circleId: string;
  zone: CircleZone;
  canDelete: boolean;
  onClose: () => void;
  onSaved: (zone: CircleZone) => void;
  onDeleted: (zoneId: string) => void;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("overview");
  const [name, setName] = useState(zone.title);
  const [allowPublic, setAllowPublic] = useState(zone.allowPublicMessage);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = saving || deleting;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const dirty =
    name.trim() !== zone.title || allowPublic !== zone.allowPublicMessage;
  const nameValid = name.trim().length > 0;

  const reset = () => {
    setName(zone.title);
    setAllowPublic(zone.allowPublicMessage);
    setError(null);
  };

  const save = async () => {
    if (!dirty || !nameValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await updateZone(circleId, zone.id, {
        title: name.trim(),
        allowPublicMessage: allowPublic,
      });
      onSaved(saved);
    } catch (err) {
      const message = backendErrorMessage(err);
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteZone(circleId, zone.id);
      onDeleted(zone.id);
    } catch (err) {
      const message = backendErrorMessage(err);
      setError(message);
      toast.error(message);
      setDeleting(false);
    }
  };

  const tabButton = (value: Tab, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setTab(value)}
      aria-current={tab === value ? "page" : undefined}
      className={`cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        tab === value
          ? "bg-bg font-semibold text-ink"
          : "text-muted hover:bg-bg hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("circle.zoneSettings")}
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-ink">
              <span aria-hidden className="text-subtle">
                #{" "}
              </span>
              {zone.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {t("circle.zoneSettings")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t("common.close")}
            className="cursor-pointer rounded-full p-1.5 text-muted transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            aria-label={t("circle.zoneSettings")}
            className="flex shrink-0 gap-1 border-b border-line p-3 sm:w-44 sm:flex-col sm:border-r sm:border-b-0"
          >
            {tabButton("overview", t("circle.overviewTab"))}
            {tabButton("permissions", t("circle.permissionsTab"))}
            <div className="mx-1 hidden border-t border-line sm:my-2 sm:block" />
            <button
              type="button"
              onClick={() => setTab("delete")}
              aria-current={tab === "delete" ? "page" : undefined}
              className={`cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                tab === "delete"
                  ? "bg-error/10 font-semibold text-error"
                  : "text-error hover:bg-error/10"
              }`}
            >
              {t("circle.deleteZone")}
            </button>
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            {tab === "overview" ? (
              <div>
                <label
                  htmlFor="zone-settings-name"
                  className="text-xs font-semibold tracking-wide text-subtle uppercase"
                >
                  {t("circle.zoneName")}
                </label>
                <div className="mt-2 flex items-center rounded-xl border border-line bg-bg px-3 transition-colors focus-within:border-accent">
                  <span
                    aria-hidden
                    className="text-base text-subtle select-none"
                  >
                    #
                  </span>
                  <input
                    id="zone-settings-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    className="w-full bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-subtle"
                  />
                </div>
                {!nameValid ? (
                  <p className="mt-2 text-sm text-error">
                    {t("circle.zoneNameRequired")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {tab === "permissions" ? (
              <fieldset>
                <legend className="text-xs font-semibold tracking-wide text-subtle uppercase">
                  {t("circle.whoCanPost")}
                </legend>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    {
                      value: true,
                      label: t("circle.everyoneCanPost"),
                      hint: t("circle.everyoneCanPostHint"),
                    },
                    {
                      value: false,
                      label: t("circle.ownerCanPost"),
                      hint: t("circle.ownerCanPostHint"),
                    },
                  ].map((option) => (
                    <label
                      key={String(option.value)}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                        allowPublic === option.value
                          ? "border-accent bg-accent/5"
                          : "border-line hover:bg-bg"
                      }`}
                    >
                      <input
                        type="radio"
                        name="zone-who-can-post"
                        checked={allowPublic === option.value}
                        onChange={() => setAllowPublic(option.value)}
                        style={{ accentColor: "var(--color-accent)" }}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {tab === "delete" ? (
              <div>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {t("circle.deleteZoneTitle", { title: zone.title })}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {t("circle.deleteZoneConfirm", { title: zone.title })}
                </p>
                {!canDelete ? (
                  <p className="mt-3 text-sm text-error">
                    {t("circle.keepOneZone")}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={!canDelete || deleting}
                  className="mt-5 cursor-pointer rounded-full bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deleting ? t("circle.deleting") : t("circle.deleteZone")}
                </button>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-4 text-sm text-error">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        {dirty && tab !== "delete" ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-bg px-5 py-3">
            <p className="min-w-0 flex-1 text-sm text-muted">
              {t("circle.unsavedChanges")}
            </p>
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
            >
              {t("circle.resetChanges")}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !nameValid}
              className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? t("circle.saving") : t("circle.saveChanges")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
