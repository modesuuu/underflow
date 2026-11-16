"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProfileBasics, updateProfileBasics } from "../api";

/**
 * Name + bio editing inside Settings → Profile (audit P1 #14).
 * The endpoint (PUT /api/profiles/me) already accepted these
 * fields; until now only the public profile page could change
 * them. Values load from GET /api/profiles/me.
 */
export function ProfileBasicsForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfileBasics()
      .then((basics) => {
        setName(basics.fullName);
        setBio(basics.bio);
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await updateProfileBasics(name.trim(), bio.trim());
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
