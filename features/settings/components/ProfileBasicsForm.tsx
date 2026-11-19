"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ProfileMarkdown } from "@/features/profile/components/ProfileMarkdown";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProfileBasics, updateProfileBasics } from "../api";

/**
 * Name + bio + Profile Detail editing inside Settings → Profile.
 * The endpoint (PUT /api/profiles/me) already accepted these
 * fields; until now only the public profile page could change
 * them. Values load from GET /api/profiles/me. The Profile Detail
 * is long-form markdown with a Write / Preview toggle, rendered
 * by the same component the public profile uses.
 */
export function ProfileBasicsForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [detail, setDetail] = useState("");
  const [detailTab, setDetailTab] = useState<"write" | "preview">("write");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfileBasics()
      .then((basics) => {
        setName(basics.fullName);
        setBio(basics.bio);
        setDetail(basics.profileDetail);
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await updateProfileBasics(name.trim(), bio.trim(), detail);
      toast.success(t("settings.profile.basicsSaved"));
    } catch {
      toast.error(t("settings.profile.basicsFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <p className="text-sm text-error">
        {t("settings.profile.basicsLoadFailed")}
      </p>
    );
  }
  if (!loaded) {
    return <p className="text-sm text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">
        {t("settings.profile.basicsTitle")}
      </h3>
      <TextInput
        label={t("settings.profile.nameLabel")}
        value={name}
        onChange={setName}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="settings-bio"
          className="text-sm font-medium text-ink"
        >
          {t("settings.profile.bioLabel")}
        </label>
        <textarea
          id="settings-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder={t("settings.profile.bioPlaceholder")}
          className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-subtle"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="settings-detail"
            className="text-sm font-medium text-ink"
          >
            {t("settings.profile.detailLabel")}
          </label>
          <div className="flex gap-0.5 rounded-full bg-bg p-0.5">
            {(
              [
                { key: "write", label: t("settings.profile.writeTab") },
                { key: "preview", label: t("settings.profile.previewTab") },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDetailTab(tab.key)}
                aria-pressed={detailTab === tab.key}
                className={
                  detailTab === tab.key
                    ? "rounded-full bg-surface px-3 py-1 text-[13px] font-medium text-ink"
                    : "rounded-full px-3 py-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {detailTab === "write" ? (
          <textarea
            id="settings-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={10}
            maxLength={20000}
            placeholder={t("settings.profile.detailPlaceholder")}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-subtle"
          />
        ) : (
          <div className="min-h-[260px] rounded-lg border border-line bg-surface px-3 py-2">
            {detail.trim() ? (
              <ProfileMarkdown source={detail} />
            ) : (
              <p className="text-sm text-muted">
                {t("settings.profile.previewEmpty")}
              </p>
            )}
          </div>
        )}
        <p className="text-[13px] text-muted">
          {t("settings.profile.detailHint")}
        </p>
      </div>
      <div>
        <Button
          label={saving ? t("common.loading") : t("settings.profile.saveBasics")}
          variant="primary"
          isDisabled={saving || name.trim().length === 0}
          onClick={() => void save()}
        />
      </div>
    </div>
  );
}
