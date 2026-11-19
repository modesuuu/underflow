"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ProfileMarkdown } from "@/features/profile/components/ProfileMarkdown";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProfileForm, updateProfileForm, type ProfileLink } from "../api";
import { useUnsavedChangesGuard } from "../useUnsavedChangesGuard";

/**
 * The whole editable Settings → Profile form — name, bio, Profile
 * Detail and the social/portfolio links — behind ONE Save button.
 * Saving sends a single PUT /api/profiles/me (transactional on the
 * backend), so the page never half-saves. While the form differs
 * from the loaded snapshot, the unsaved-changes guard watches the
 * browser Back button, in-app link clicks and tab close/refresh,
 * and asks through a modal before letting the user leave.
 */

const PLATFORMS = [
  { platform: "GitHub", label: "GitHub", placeholder: "https://github.com/username" },
  { platform: "Instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { platform: "LinkedIn", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { platform: "Twitter", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { platform: "Website", label: "", placeholder: "https://your-portfolio.com" },
] as const;

function linkRecord(links: ProfileLink[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const p of PLATFORMS) {
    record[p.platform] =
      links.find(
        (l) => l.platform.toLowerCase() === p.platform.toLowerCase(),
      )?.url ?? "";
  }
  return record;
}

/** The comparable shape of the form: trimmed name/bio, the raw
 *  detail, and the non-empty links in platform order. Used both
 *  for the loaded snapshot and the live dirty check. */
function serialize(
  name: string,
  bio: string,
  detail: string,
  values: Record<string, string>,
): string {
  const links = PLATFORMS.flatMap((p) => {
    const url = (values[p.platform] ?? "").trim();
    return url ? [{ platform: p.platform, url }] : [];
  });
  return JSON.stringify({
    name: name.trim(),
    bio: bio.trim(),
    detail,
    links,
  });
}

export function ProfileForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [detail, setDetail] = useState("");
  const [detailTab, setDetailTab] = useState<"write" | "preview">("write");
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const snapshotRef = useRef("");

  useEffect(() => {
    getProfileForm()
      .then((data) => {
        const record = linkRecord(data.links);
        setName(data.fullName);
        setBio(data.bio);
        setDetail(data.profileDetail);
        setLinkValues(record);
        snapshotRef.current = serialize(
          data.fullName,
          data.bio,
          data.profileDetail,
          record,
        );
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  const dirty =
    loaded && serialize(name, bio, detail, linkValues) !== snapshotRef.current;
  const guard = useUnsavedChangesGuard(dirty);

  async function save() {
    // Normalize + validate the links first; one bad URL blocks the
    // whole save so nothing half-executes.
    const links: ProfileLink[] = [];
    for (const p of PLATFORMS) {
      const raw = (linkValues[p.platform] ?? "").trim();
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
      await updateProfileForm({
        fullName: name.trim(),
        bio: bio.trim(),
        profileDetail: detail,
        links,
      });
      const record = linkRecord(links);
      setLinkValues(record);
      snapshotRef.current = serialize(name, bio, detail, record);
      guard.disarmAfterSave();
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

      <div className="h-px w-full bg-line" />

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
          value={linkValues[p.platform] ?? ""}
          onChange={(value) =>
            setLinkValues((prev) => ({ ...prev, [p.platform]: value }))
          }
        />
      ))}
      <p className="text-[13px] text-muted">
        {t("settings.profile.linksHint")}
      </p>

      <div className="flex items-center gap-3 pt-1">
        <Button
          label={saving ? t("common.loading") : t("settings.profile.saveBasics")}
          variant="primary"
          isDisabled={saving || !dirty || name.trim().length === 0}
          onClick={() => void save()}
        />
        {dirty && (
          <span className="text-[13px] text-muted">
            {t("settings.unsavedHint")}
          </span>
        )}
      </div>

      {guard.pendingNav && (
        <ConfirmDialog
          title={t("settings.unsavedTitle")}
          description={t("settings.unsavedDesc")}
          confirmLabel={t("settings.unsavedLeave")}
          onConfirm={guard.confirmLeave}
          onCancel={guard.cancelLeave}
        />
      )}
    </div>
  );
}
