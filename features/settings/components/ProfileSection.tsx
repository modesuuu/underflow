"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { Avatar } from "@/components/ui/Avatar";
import { getSession, setSession } from "@/features/auth/session";
import { useSessionUser } from "@/features/auth/store";
import { uploadImage } from "@/features/dashboard/api";
import { SettingsSection } from "./SettingsSection";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { updateProfilePhoto } from "../api";
import { ProfileForm } from "./ProfileForm";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Profile section of Settings: the profile photo (uploaded
 * straight to Cloudinary, then saved with PUT /api/profiles/me)
 * on top, and below it the ProfileForm, which owns everything
 * else on the page — name, Profile Detail, links and the skill
 * selection — behind its single Save button.
 */
export function ProfileSection() {
  const { t } = useLanguage();
  const user = useSessionUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

      <ProfileForm />
    </SettingsSection>
  );
}
