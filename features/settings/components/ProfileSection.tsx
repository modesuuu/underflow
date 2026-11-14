"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { getSession, setSession } from "@/features/auth/session";
import { useSessionUser } from "@/features/auth/store";
import { uploadImage } from "@/features/dashboard/api";
import {
  SYSTEM_SKILL_ICONS,
  createSkill,
  deleteSkill,
  getSkills,
  validateSkillName,
  type Skill,
} from "@/features/collaborations/skills-api";
import { SettingsSection } from "./SettingsSection";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { updateProfilePhoto } from "../api";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Profile section of Settings: the profile photo (uploaded
 * straight to Cloudinary, then saved with PUT /api/profiles/me)
 * and the user's skills. System skills are listed locked — they
 * are the shared role vocabulary and cannot be removed; private
 * skills can be added and removed here, the same endpoints the
 * New Project modal uses.
 */
export function ProfileSection() {
  const { t } = useLanguage();
  const user = useSessionUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function loadSkills() {
    setSkillsError(null);
    try {
      setSkills(await getSkills());
    } catch {
      setSkillsError(t("settings.profile.couldNotLoadSkills"));
    }
  }

  useEffect(() => {
    void loadSkills();
  }, []);

  async function handlePhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.profile.notImage"));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(t("settings.profile.photoTooLarge"));
      return;
    }
    setUploading(true);
    try {
      const { url, public_id } = await uploadImage(file);
      await updateProfilePhoto(url, public_id);
      // Patch the session so the sidebar avatar and every other
      // CURRENT_USER.photo reader update now, not on next login.
      const session = getSession();
      if (session) {
        setSession({
          ...session,
          user: { ...session.user, photo: url },
        });
      }
      toast.success(t("settings.profile.photoUpdated"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.profile.couldNotUpdatePhoto"),
      );
    } finally {
      setUploading(false);
    }
  }

  async function addSkill() {
    const name = draft.trim();
    const invalid = validateSkillName(name);
    if (invalid) {
      setAddError(invalid);
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const created = await createSkill(name);
      setSkills((prev) => (prev ? [...prev, created] : [created]));
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
      setConfirmRemoveId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.profile.couldNotRemoveSkill"),
      );
    } finally {
      setRemoving(false);
    }
  }

  const systemSkills = skills?.filter((s) => s.scope === "system") ?? [];
  const privateSkills = skills?.filter((s) => s.scope !== "system") ?? [];
  const confirming =
    privateSkills.find((s) => s.id === confirmRemoveId) ?? null;

  return (
    <SettingsSection
      title={t("settings.profile.title")}
      description={t("settings.profile.description")}
    >
      <div className="flex items-center gap-4">
        <Avatar src={user?.photo} alt={user?.name ?? "You"} size={64} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold text-ink">
            {user?.name ?? t("common.loading")}
          </span>
          <span className="truncate text-sm text-muted">
            {user ? `@${user.username}` : ""}
          </span>
        </div>
        <Button
          label={uploading ? t("settings.profile.uploading") : t("settings.profile.changePhoto")}
          variant="secondary"
          isDisabled={uploading || !user}
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handlePhoto(file);
          }}
        />
      </div>
      <p className="-mt-2 text-[13px] text-muted">
        {t("settings.profile.photoHint")}
      </p>

      <div className="h-px w-full bg-line" />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">{t("settings.profile.yourSkills")}</h3>

        {skills === null && !skillsError && (
          <p className="text-sm text-muted">{t("settings.profile.loadingSkills")}</p>
        )}
        {skillsError && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-error">{skillsError}</p>
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
                  {systemSkills.map((skill) => (
                    <Token
                      key={skill.id}
                      label={skill.name}
                      size="sm"
                      icon={
                        SYSTEM_SKILL_ICONS[skill.name] ? (
                          <Icon name={SYSTEM_SKILL_ICONS[skill.name]} size={12} />
                        ) : undefined
                      }
                    />
                  ))}
                </div>
                <p className="text-[13px] text-muted">
                  {t("settings.profile.standardRolesNote")}
                </p>
              </div>
            )}

            {privateSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {privateSkills.map((skill) => (
                  <Token
                    key={skill.id}
                    label={skill.name}
                    size="sm"
                    onRemove={() => setConfirmRemoveId(skill.id)}
                  />
                ))}
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
                  if (e.key === "Enter") {
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
      </div>
    </SettingsSection>
  );
}
