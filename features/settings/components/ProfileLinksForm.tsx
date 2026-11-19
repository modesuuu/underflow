"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProfileLinks, updateProfileLinks, type ProfileLink } from "../api";

/**
 * Social + portfolio links inside Settings → Profile. Five fixed
 * platforms; the backend stores them as social_media rows and the
 * public profile rail renders the filled ones under the email.
 * An empty field is dropped on save, which is also how a link is
 * removed. Bare domains get https:// prepended; anything that is
 * not an http(s) URL blocks the save with a toast.
 */
const PLATFORMS = [
  { platform: "GitHub", label: "GitHub", placeholder: "https://github.com/username" },
  { platform: "Instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { platform: "LinkedIn", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { platform: "Twitter", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { platform: "Website", label: "", placeholder: "https://your-portfolio.com" },
] as const;

export function ProfileLinksForm() {
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfileLinks()
      .then((links) => {
        const record: Record<string, string> = {};
        for (const p of PLATFORMS) {
          record[p.platform] =
            links.find(
              (l) => l.platform.toLowerCase() === p.platform.toLowerCase(),
            )?.url ?? "";
        }
        setValues(record);
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  async function save() {
    const links: ProfileLink[] = [];
    for (const p of PLATFORMS) {
      const raw = (values[p.platform] ?? "").trim();
      if (!raw) continue;
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("bad protocol");
        }
      } catch {
        toast.error(t("settings.profile.linksInvalid"));
        return;
      }
      links.push({ platform: p.platform, url });
    }
    setSaving(true);
    try {
      await updateProfileLinks(links);
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
        {t("settings.profile.linksLoadFailed")}
      </p>
    );
  }
  if (!loaded) {
    return <p className="text-sm text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">
        {t("settings.profile.linksTitle")}
      </h3>
      {PLATFORMS.map((p) => (
        <TextInput
          key={p.platform}
          label={
            p.platform === "Website"
              ? t("settings.profile.websiteLabel")
              : p.label
          }
          placeholder={p.placeholder}
          value={values[p.platform] ?? ""}
          onChange={(value) =>
            setValues((prev) => ({ ...prev, [p.platform]: value }))
          }
        />
      ))}
      <p className="text-[13px] text-muted">
        {t("settings.profile.linksHint")}
      </p>
      <div>
        <Button
          label={saving ? t("common.loading") : t("settings.profile.saveBasics")}
          variant="primary"
          isDisabled={saving}
          onClick={() => void save()}
        />
      </div>
    </div>
  );
}
