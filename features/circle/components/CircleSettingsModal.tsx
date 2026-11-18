"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { backendErrorMessage } from "@/features/collaborations/api";
import { uploadImage } from "@/features/dashboard/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { deleteCircle, updateCircle } from "../api";
import type { CircleDetail } from "../types";

type Tab = "overview" | "members" | "delete";

/**
 * Circle settings (Circle settings, Discord Server Settings
 * pattern): left tabs Overview (photo + name), Members (read-only
 * list), Delete Circle in red at the bottom of the tab list with a
 * two-step confirm, and a save bar while the form is dirty. The
 * photo goes through the same direct-upload helper as posts; only
 * the resulting URL is saved on the circle.
 */
export function CircleSettingsModal({
  detail,
  onClose,
  onSaved,
  onDeleted,
}: {
  detail: CircleDetail;
  onClose: () => void;
  onSaved: (detail: CircleDetail) => void;
  onDeleted: () => void;
}) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [name, setName] = useState(detail.title);
  const [photoUrl, setPhotoUrl] = useState<string | null>(detail.photoUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = uploading || saving || deleting;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const dirty = name.trim() !== detail.title || photoUrl !== detail.photoUrl;
  const nameValid = name.trim().length > 0;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadImage(file);
      setPhotoUrl(uploaded.url);
    } catch (err) {
      const message = backendErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setName(detail.title);
    setPhotoUrl(detail.photoUrl);
    setError(null);
  };

  const save = async () => {
    if (!dirty || !nameValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const input: { title?: string; photoUrl?: string | null } = {};
      if (name.trim() !== detail.title) input.title = name.trim();
      if (photoUrl !== detail.photoUrl) input.photoUrl = photoUrl;
      const saved = await updateCircle(detail.id, input);
      onSaved(saved);
    } catch (err) {
      const message = backendErrorMessage(err);
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCircle(detail.id);
      onDeleted();
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("circle.circleSettings")}
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-line bg-surface shadow-2xl sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-ink">
              {detail.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {t("circle.circleSettings")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t("common.close")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            aria-label={t("circle.circleSettings")}
            className="flex shrink-0 gap-1 border-b border-line p-3 sm:w-44 sm:flex-col sm:border-r sm:border-b-0"
          >
            {tabButton("overview", t("circle.overviewTab"))}
            {tabButton("members", t("circle.membersTab"))}
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
              {t("circle.deleteCircle")}
            </button>
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            {tab === "overview" ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={photoUrl ?? undefined}
                    alt={name.trim() || detail.title}
                    size={64}
                    className="shrink-0"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={busy}
                      className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg disabled:opacity-50"
                    >
                      {uploading
                        ? t("circle.uploading")
                        : t("circle.changePhoto")}
                    </button>
                    {photoUrl ? (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(null)}
                        disabled={busy}
                        className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
                      >
                        {t("circle.removePhoto")}
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      void pickPhoto(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="circle-settings-name"
                    className="text-xs font-semibold tracking-wide text-subtle uppercase"
                  >
                    {t("circle.circleName")}
                  </label>
                  <input
                    id="circle-settings-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={255}
                    className="mt-2 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink transition-colors outline-none placeholder:text-subtle focus:border-accent"
                  />
                  {!nameValid ? (
                    <p className="mt-2 text-sm text-error">
                      {t("circle.circleNameRequired")}
                    </p>
                  ) : null}
                </div>

                <p className="text-sm text-muted">
                  {t("circle.membersCount", {
                    count: detail.members.length,
                  })}
                </p>
              </div>
            ) : null}

            {tab === "members" ? (
              <ul className="divide-y divide-line">
                {detail.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <Avatar
                      src={member.avatarUrl ?? undefined}
                      alt={member.name}
                      size={32}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {member.name}
                    </span>
                    {member.isOwner ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                        {t("circle.ownerRole")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "delete" ? (
              <div>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {t("circle.deleteCircleTitle", { title: detail.title })}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {t("circle.deleteCircleConfirm", { title: detail.title })}
                </p>
                {confirming ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void remove()}
                      disabled={deleting}
                      className="cursor-pointer rounded-full bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {deleting
                        ? t("circle.deleting")
                        : t("circle.confirmDelete")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                      className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="mt-5 cursor-pointer rounded-full bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {t("circle.deleteCircle")}
                  </button>
                )}
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
              disabled={busy}
              className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
            >
              {t("circle.resetChanges")}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !nameValid}
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
