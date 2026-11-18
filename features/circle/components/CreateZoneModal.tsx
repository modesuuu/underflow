"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { backendErrorMessage } from "@/features/collaborations/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { createZone } from "../api";
import type { CircleZone } from "../types";

/**
 * Create-zone modal (Circle settings, Discord Create Channel
 * pattern): a name field with a # prefix and one posting-permission
 * switch. Create stays disabled while the name is empty; on success
 * the caller selects the new zone so it opens immediately.
 */
export function CreateZoneModal({
  circleId,
  onClose,
  onCreated,
}: {
  circleId: string;
  onClose: () => void;
  onCreated: (zone: CircleZone) => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [ownerOnly, setOwnerOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const canSubmit = name.trim().length > 0 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const zone = await createZone(circleId, {
        title: name.trim(),
        allowPublicMessage: !ownerOnly,
      });
      onCreated(zone);
    } catch (err) {
      const message = backendErrorMessage(err);
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("circle.createZone")}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-lg border border-line bg-surface p-5 shadow-2xl sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {t("circle.createZone")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {t("circle.createZoneHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={t("common.close")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <form
          className="mt-5 flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div>
            <label
              htmlFor="create-zone-name"
              className="text-xs font-semibold tracking-wide text-subtle uppercase"
            >
              {t("circle.zoneName")}
            </label>
            <div className="mt-2 flex items-center rounded-lg border border-line bg-bg px-3 transition-colors focus-within:border-accent">
              <span aria-hidden className="text-base text-subtle select-none">
                #
              </span>
              <input
                ref={inputRef}
                id="create-zone-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                placeholder={t("circle.zoneNamePlaceholder")}
                className="w-full bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-subtle"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">
                {t("circle.ownerOnlyPosting")}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {t("circle.ownerOnlyPostingHint")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ownerOnly}
              aria-label={t("circle.ownerOnlyPosting")}
              onClick={() => setOwnerOnly((value) => !value)}
              className={`mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors ${
                ownerOnly ? "bg-accent" : "bg-line"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  ownerOnly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? t("circle.creating") : t("circle.createZone")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
