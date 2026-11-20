"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Icon } from "@/components/ui/Icon";
import { isImeConfirmingEnter } from "@/lib/keyboard";
import { ProfileMarkdown } from "@/features/profile/components/ProfileMarkdown";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";
import {
  SYSTEM_SKILL_ICONS,
  createSkill,
  deleteSkill,
  getSkills,
  validateSkillName,
  type Skill,
} from "@/features/collaborations/skills-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProfileForm, updateProfileForm, type ProfileLink } from "../api";
import { useUnsavedChangesGuard } from "../useUnsavedChangesGuard";

/**
 * The whole editable Settings → Profile form — name, Profile
 * Detail, the social/portfolio links and the profile skill
 * selection — behind ONE Save button at the bottom of the page.
 * Saving sends a single PUT /api/profiles/me (transactional on
 * the backend), so the page never half-saves. While the form
 * differs from the loaded snapshot, the unsaved-changes guard
 * watches the browser Back button, in-app link clicks and tab
 * close/refresh, and asks through a modal before letting the
 * user leave.
 *
 * Two skill operations stay instant because they manage the
 * skill entities themselves, not the selection: adding a
 * personal skill creates it (the backend links it to the
 * profile right away) and removing one deletes it. Only the
 * standard-role toggles are draft state saved by the button.
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

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/** The comparable shape of the form fields: trimmed name, the
 *  raw detail, and the non-empty links in platform order. Used
 *  both for the loaded snapshot and the live dirty check. The
 *  skill selection is compared separately against its own
 *  saved snapshot, because add/remove apply instantly. */
function serialize(
  name: string,
  detail: string,
  values: Record<string, string>,
): string {
  const links = PLATFORMS.flatMap((p) => {
    const url = (values[p.platform] ?? "").trim();
    return url ? [{ platform: p.platform, url }] : [];
  });
  return JSON.stringify({
    name: name.trim(),
    detail,
    links,
  });
}

export function ProfileForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [detailTab, setDetailTab] = useState<"write" | "preview">("write");
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const snapshotRef = useRef("");

  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [skillsError, setSkillsError] = useState(false);
  const [profileSkillIds, setProfileSkillIds] = useState<string[]>([]);
  const [savedSkillIds, setSavedSkillIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function loadSkills() {
    setSkillsError(false);
    try {
      setSkills(await getSkills());
    } catch {
      setSkillsError(true);
    }
  }

  useEffect(() => {
    void loadSkills();
    getProfileForm()
      .then((data) => {
        const record = linkRecord(data.links);
        setName(data.fullName);
        setDetail(data.profileDetail);
        setLinkValues(record);
        setProfileSkillIds(data.skillIds);
        setSavedSkillIds(data.skillIds);
        snapshotRef.current = serialize(
          data.fullName,
          data.profileDetail,
          record,
        );
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  const dirty =
    loaded &&
    (serialize(name, detail, linkValues) !== snapshotRef.current ||
      !sameIds(profileSkillIds, savedSkillIds));
  const guard = useUnsavedChangesGuard(dirty);

  function toggleProfileSkill(skill: Skill) {
    setProfileSkillIds((prev) =>
      prev.includes(skill.id)
        ? prev.filter((id) => id !== skill.id)
        : [...prev, skill.id],
    );
  }

  async function addSkill() {
    const skillName = draft.trim();
    const invalid = validateSkillName(skillName);
    if (invalid) {
      setAddError(invalid);
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const created = await createSkill(skillName);
      setSkills((prev) => (prev ? [...prev, created] : [created]));
      // The backend links a new personal skill to the profile
      // at creation, so it counts as saved, not as a draft edit.
      setProfileSkillIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id],
      );
      setSavedSkillIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id],
      );
      setDraft("");
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : t("settings.profile.couldNotAddSkill"),
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveSkill(skill: Skill) {
    setRemoving(true);
    try {
      await deleteSkill(skill.id);
      setSkills((prev) => (prev ? prev.filter((s) => s.id !== skill.id) : prev));
      setProfileSkillIds((prev) => prev.filter((id) => id !== skill.id));
      setSavedSkillIds((prev) => prev.filter((id) => id !== skill.id));
      setConfirmRemoveId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.profile.couldNotRemoveSkill"),
      );
    } finally {
      setRemoving(false);
    }
  }

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
        profileDetail: detail,
        links,
        skillIds: profileSkillIds,
      });
      const record = linkRecord(links);
      setLinkValues(record);
      snapshotRef.current = serialize(name, detail, record);
      setSavedSkillIds(profileSkillIds);
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

  const systemSkills = skills?.filter((s) => s.scope === "system") ?? [];
  const privateSkills = skills?.filter((s) => s.scope !== "system") ?? [];
  const confirming =
    privateSkills.find((s) => s.id === confirmRemoveId) ?? null;

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

      <div className="h-px w-full bg-line" />

      <h3 className="text-sm font-semibold text-ink">
        {t("settings.profile.yourSkills")}
      </h3>

      {skills === null && !skillsError && (
        <p className="text-sm text-muted">{t("settings.profile.loadingSkills")}</p>
      )}
      {skillsError && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-error">
            {t("settings.profile.couldNotLoadSkills")}
          </p>
          <button
            type="button"
            onClick={() => void loadSkills()}
            className="pressable cursor-pointer text-sm font-medium text-ink underline underline-offset-2"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {skills !== null && (
        <>
          {systemSkills.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {systemSkills.map((skill) => {
                  const onProfile = profileSkillIds.includes(skill.id);
                  return (
                    <Token
                      key={skill.id}
                      label={skill.name}
                      size="sm"
                      color={onProfile ? "green" : undefined}
                      icon={
                        SYSTEM_SKILL_ICONS[skill.name] ? (
                          <Icon
                            name={SYSTEM_SKILL_ICONS[skill.name]}
                            size={12}
                          />
                        ) : undefined
                      }
                      endContent={
                        <Icon name={onProfile ? "check" : "plus"} size={12} />
                      }
                      onClick={() => toggleProfileSkill(skill)}
                    />
                  );
                })}
              </div>
              <p className="text-[13px] text-muted">
                {t("settings.profile.standardRolesNote")}
              </p>
            </div>
          )}

          {privateSkills.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {privateSkills.map((skill) => {
                  const onProfile = profileSkillIds.includes(skill.id);
                  return (
                    <Token
                      key={skill.id}
                      label={skill.name}
                      size="sm"
                      color={onProfile ? "green" : undefined}
                      onClick={() => toggleProfileSkill(skill)}
                      onRemove={() => setConfirmRemoveId(skill.id)}
                    />
                  );
                })}
              </div>
              <p className="text-[13px] text-muted">
                {t("settings.profile.privateSkillsNote")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {t("settings.profile.noSkillsYet")}
            </p>
          )}

          {confirming && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-bg px-3 py-2">
              <span className="text-sm text-ink">
                {t("settings.profile.removePrompt", { name: confirming.name })}
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() => void handleRemoveSkill(confirming)}
                className="pressable cursor-pointer rounded-full bg-error px-3 py-1 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {removing ? t("settings.profile.removing") : t("settings.profile.remove")}
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => setConfirmRemoveId(null)}
                className="pressable cursor-pointer rounded-full px-3 py-1 text-[13px] font-medium text-muted hover:text-ink"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}

          <div className="flex items-start gap-2">
            <div
              className="min-w-0 flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isImeConfirmingEnter(e)) {
                  e.preventDefault();
                  void addSkill();
                }
              }}
            >
              <TextInput
                label={t("settings.profile.addSkillPlaceholder")}
                isLabelHidden
                placeholder={t("settings.profile.addSkillPlaceholder")}
                value={draft}
                onChange={(value) => {
                  setDraft(value);
                  if (addError) setAddError(null);
                }}
              />
              {addError && (
                <p className="mt-1.5 text-[13px] text-error">{addError}</p>
              )}
            </div>
            <Button
              label={adding ? t("settings.profile.adding") : t("settings.profile.add")}
              variant="primary"
              isDisabled={adding || draft.trim().length === 0}
              onClick={() => void addSkill()}
            />
          </div>
        </>
      )}

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
