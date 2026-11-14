"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { DateField } from "@/components/ui/DateField";
import { Avatar } from "@/components/ui/Avatar";
import { useSessionUser } from "@/features/auth/store";
import { toast } from "sonner";
import {
  backendErrorMessage,
  createCollabProject,
  updateCollabProject,
} from "../api";
import {
  createSkill,
  deleteSkill,
  getSkills,
  validateSkillName,
  SYSTEM_SKILL_ICONS,
  SYSTEM_SKILL_ORDER,
  type Skill,
} from "../skills-api";
import type { CollabProject } from "../types";
import { ApiError } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface MakeCollabModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the modal edits this project instead of creating one. */
  editing?: CollabProject | null;
  /** Edit mode only: fired after a successful save, before onClose. */
  onUpdated?: () => void;
}

/** Max photo upload constraints (matches 5-slot design). */
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB per file



/** A selected photo with a preview URL. New picks carry their File;
 *  photos the project already has (edit mode) carry only the remote
 *  URL + its Cloudinary public id. */
interface PhotoDraft {
  file?: File;
  url: string;
  publicId?: string | null;
}

export function MakeCollabModal({
  open,
  onClose,
  editing,
  onUpdated,
}: MakeCollabModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  // P1-C #17: remember the trigger that opened the modal so focus can be
  // restored on close.
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);
  // Skill delete (audit P2-10): the skill awaiting confirm, and the id
  // currently being deleted (its chip stays disabled while in flight).
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState<Skill | null>(
    null
  );
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const sessionUser = useSessionUser();
  const ownerName = sessionUser?.username ?? "You";
  const [roleCount, setRoleCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  // P2: exit animation state — modal stays mounted until the CSS out-animation
  // finishes (timeout also covers reduced-motion where the animation never runs).
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  // Skills come from the real backend (GET /api/skills) — the old
  // hardcoded s1–s8 options do not exist in the skills table and made
  // POST /api/collab answer 400 'not found'.
  const loadSkills = async () => {
    setSkillsLoading(true);
    setSkillsError(null);
    try {
      setSkills(await getSkills());
    } catch (err) {
      setSkillsError(
        err instanceof Error ? err.message : "Could not load your skills."
      );
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // Edit mode: every open starts from the project's current values,
  // so an abandoned edit never leaks into the next session. (Create
  // mode keeps its draft between opens, as before.)
  useEffect(() => {
    if (!open || !editing) return;
    setTitle(editing.title);
    setDescription(editing.description);
    setSelectedSkills(new Set(editing.skills.map((s) => s.id)));
    setRoleCount(editing.slotsTotal);
    setDueDate(editing.dueDate);
    setPhotos(
      editing.photos.map((url, i) => ({
        url,
        publicId: editing.photoPublicIds[i] ?? null,
      }))
    );
    setSubmitError(null);
    setFieldErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  useEffect(() => {
    if (!closing) return;
    // The CSS out-animation is 180ms; hold the mount 200ms so the exit
    // finishes before unmount (forwards fill keeps opacity 0 until then).
    const t = setTimeout(() => setClosing(false), 200);
    return () => clearTimeout(t);
  }, [closing]);

  const requestClose = () => {
    setClosing(true);
    onClose();
  };

  // P1-C #17: dialog a11y — focus moves to the first field on open, is
  // trapped while open, and returns to the trigger on close. Esc closes
  // (previously it only cleared the custom-role draft).
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    firstFieldRef.current?.focus();

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // Restore focus when the open-session ends (close or unmount).
      previousFocusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Track live blob URLs in a ref so the unmount cleanup revokes exactly the
  // ones still open (removed entries are already revoked inline).
  const photoUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      photoUrlsRef.current = [];
    };
  }, []);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    setPhotoError(null);

    const accepted: PhotoDraft[] = [];
    let rejectedReason: string | null = null;
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        rejectedReason = "Only image files are allowed.";
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        rejectedReason = `Max ${MAX_PHOTO_BYTES / 1024 / 1024} MB per photo.`;
        continue;
      }
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        rejectedReason = `Max ${MAX_PHOTOS} photos.`;
        break;
      }
      const url = URL.createObjectURL(file);
      accepted.push({ file, url });
    }

    if (accepted.length > 0) {
      const next = [...photos, ...accepted];
      setPhotos(next);
      photoUrlsRef.current = next.map((p) => p.url);
    }
    if (rejectedReason) setPhotoError(rejectedReason);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (removed) {
        URL.revokeObjectURL(removed.url);
        photoUrlsRef.current = next.map((p) => p.url);
      }
      return next;
    });
    setPhotoError(null);
  };

  /**
   * Create-as-private-skill + select path (POST /api/skills) behind the
   * "Add a skill" input. If the name matches a skill the user can
   * already see (a static system skill or one of their own), that skill
   * is selected instead of creating a duplicate; a 409 likewise selects
   * the existing skill silently instead of erroring. Throws on any
   * other failure.
   */
  const createAndSelectSkill = async (name: string) => {
    const existing = skills.find(
      (s) => s.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setSelectedSkills((prev) => new Set(prev).add(existing.id));
      return;
    }
    try {
      const skill = await createSkill(name);
      setSkills((prev) => [...prev, skill]);
      setSelectedSkills((prev) => new Set(prev).add(skill.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Duplicate name — the skill already exists for this user. Select
        // the existing one instead of showing an error.
        const found = skills.find(
          (s) => s.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (found) {
          setSelectedSkills((prev) => new Set(prev).add(found.id));
        } else {
          // List is stale — reload so the skill shows up as a chip.
          void loadSkills();
        }
        return;
      }
      throw err;
    }
  };

  // P2: open/close animations are CSS keyframes (globals.css .modal-*-in/out),
  // gated behind prefers-reduced-motion. GSAP was dropped for this trivial
  // opacity/scale use — CSS is simpler and cheaper. (The sidebar migrated to
  // CSS in the same round; gsap has no remaining source consumers and was
  // removed from package.json.)

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Chips to render: the static system skills first (mockup order,
   *  each with its icon, never deletable), then the user's own private
   *  skills. A private skill whose name matches a system skill is not
   *  rendered: the static tag already covers that name, so a tag never
   *  shows twice. */
  const systemSkills = skills
    .filter((s) => s.scope === "system")
    .sort((a, b) => {
      const rank = (name: string) => {
        const i = SYSTEM_SKILL_ORDER.indexOf(name);
        return i === -1 ? SYSTEM_SKILL_ORDER.length : i;
      };
      return rank(a.name) - rank(b.name);
    });
  const systemNames = new Set(
    systemSkills.map((s) => s.name.trim().toLowerCase())
  );
  const visibleSkills = [
    ...systemSkills,
    ...skills.filter(
      (s) =>
        s.scope === "private" &&
        !systemNames.has(s.name.trim().toLowerCase())
    ),
  ];

  /** The one skill input: create the name as a private skill and select it. */
  const addSkill = async () => {
    const name = skillDraft.trim();
    if (!name || creatingSkill) return;
    setCreatingSkill(true);
    setSkillError(null);
    const invalid = validateSkillName(name);
    if (invalid) {
      setSkillError(invalid);
      setCreatingSkill(false);
      return;
    }
    try {
      await createAndSelectSkill(name);
      setSkillDraft("");
    } catch (err) {
      setSkillError(
        err instanceof Error ? err.message : t("modal.couldNotAddSkill")
      );
    } finally {
      setCreatingSkill(false);
    }
  };

  /**
   * Delete the skill pending confirmation (DELETE /api/skills/:id). On
   * success the chip disappears and the skill is deselected if it was
   * selected. On failure (409 "Skill masih digunakan..." when a live
   * collab still references it, 403, ...) the backend's message is
   * shown inline via skillError and the chip stays.
   */
  const confirmDeleteSkill = async () => {
    const skill = pendingDeleteSkill;
    if (!skill || deletingSkillId) return;
    setDeletingSkillId(skill.id);
    setSkillError(null);
    try {
      await deleteSkill(skill.id);
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      setSelectedSkills((prev) => {
        const next = new Set(prev);
        next.delete(skill.id);
        return next;
      });
      setPendingDeleteSkill(null);
    } catch (err) {
      setSkillError(
        err instanceof Error
          ? backendErrorMessage(err)
          : t("modal.couldNotDeleteSkill")
      );
      setPendingDeleteSkill(null);
    } finally {
      setDeletingSkillId(null);
    }
  };

  const handleSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Escape") {
      setSkillDraft("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Inline validation (visible errors, not just the native bubble)
    const errors: { title?: string; description?: string } = {};
    if (!title.trim()) errors.title = t("modal.titleRequired");
    if (!description.trim()) errors.description = t("modal.descriptionRequired");
    if (errors.title || errors.description) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    // Photos are uploaded inside the api functions (POST /api/upload);
    // an upload failure throws, shows inline, and keeps the draft.
    const newFiles = photos
      .filter((p) => p.file)
      .map((p) => p.file as File);
    try {
      if (editing) {
        await updateCollabProject(editing.id, {
          title: title.trim(),
          description: description.trim(),
          skillIds: [...selectedSkills],
          slotsTotal: roleCount,
          dueDate,
          photos: newFiles,
          existingPhotos: photos
            .filter((p) => !p.file)
            .map((p) => ({ url: p.url, publicId: p.publicId ?? null })),
        });
      } else {
        await createCollabProject({
          title: title.trim(),
          description: description.trim(),
          skillIds: [...selectedSkills],
          slotsTotal: roleCount,
          dueDate,
          photos: newFiles,
        });
      }
    } catch (err) {
      setSubmitting(false);
      setSubmitError(
        err instanceof Error
          ? err.message
          : editing
            ? t("modal.couldNotSaveChanges")
            : t("modal.couldNotCreateProject")
      );
      return;
    }
    setSubmitting(false);
    setClosing(false);
    if (editing) {
      toast.success(t("modal.projectUpdated"), {
        description: t("modal.projectUpdatedBody", { title: title.trim() }),
      });
      onUpdated?.();
    } else {
      toast.success(t("modal.collabPosted"), {
        description: t("modal.collabPostedBody", { title: title.trim() }),
      });
    }
    onClose();
  };

  if (!open && !closing) return null;

  return (
    <div
      ref={overlayRef}
      onClick={requestClose}
      className={clsx(
        "fixed inset-0 z-50 bg-ink/60",
        closing ? "modal-overlay-out" : "modal-overlay-in"
      )}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="make-collab-title"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "-16px 0 40px rgb(0 0 0 / 0.14)" }}
        className={clsx(
          "fixed inset-y-0 right-0 flex w-full max-w-[596px] flex-col border-l border-line bg-bg sm:rounded-l-lg",
          closing ? "sheet-out" : "sheet-in"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-6">
          <div>
            <h2 id="make-collab-title" className="text-2xl font-medium">
              {editing ? t("modal.editProject") : t("modal.createProject")}
            </h2>
            <p className="mt-1 text-xs font-medium text-muted">
              {editing
                ? t("modal.editProjectSub")
                : t("modal.createProjectSub")}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t("common.close")}
            className="pressable cursor-pointer rounded-md p-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="x" size={24} className="text-ink" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
          {/* Title (Astryx TextInput; its status carries the error) */}
          <TextInput
            id="make-collab-title-input"
            ref={firstFieldRef}
            label={t("modal.titleLabel")}
            value={title}
            onChange={(value) => {
              setTitle(value);
              if (fieldErrors.title)
                setFieldErrors((f) => ({ ...f, title: undefined }));
            }}
            placeholder={t("modal.titlePlaceholder")}
            status={
              fieldErrors.title
                ? { type: "error", message: fieldErrors.title }
                : undefined
            }
          />

          {/* Descriptions (Astryx TextArea) */}
          <TextArea
            id="make-collab-desc-input"
            label={t("modal.descriptionsLabel")}
            value={description}
            onChange={(value) => {
              setDescription(value);
              if (fieldErrors.description)
                setFieldErrors((f) => ({ ...f, description: undefined }));
            }}
            placeholder={t("modal.descriptionsPlaceholder")}
            rows={3}
            status={
              fieldErrors.description
                ? { type: "error", message: fieldErrors.description }
                : undefined
            }
          />

          {/* Due date (optional). There is deliberately no Type field:
              the project type is never shown anywhere in the app, so
              asking for it here was pointless. The backend stores its
              default. */}
          <div className="flex flex-col gap-1">
            <label htmlFor="make-collab-due-input" className="text-base font-medium">{t("modal.dueDate")}</label>
            <DateField
              id="make-collab-due-input"
              value={dueDate}
              onChange={setDueDate}
            />
          </div>

          {/* Roles / Skills */}
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium">
              {t("modal.roleQuestion")}
            </label>
            {/* The one and only skill input: whatever is typed here becomes
                a private skill (POST /api/skills) and is selected as a role
                for this project. The old separate "Make Custom Role" field
                did exactly the same thing, so it was removed. */}
            <div className="flex items-start gap-2">
              <div
                className="min-w-0 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  } else if (e.key === "Escape") {
                    setSkillDraft("");
                  }
                }}
              >
                <TextInput
                  label={t("modal.addSkill")}
                  isLabelHidden
                  value={skillDraft}
                  onChange={(value) => setSkillDraft(value)}
                  placeholder={t("modal.addSkill")}
                />
              </div>
              <IconButton
                label={t("modal.addSkillBtn")}
                variant="primary"
                icon={<Icon name="plus" size={16} />}
                onClick={addSkill}
                isDisabled={!skillDraft.trim() || creatingSkill}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {skillsLoading ? (
                <p className="text-xs text-muted">{t("modal.loadingSkills")}</p>
              ) : skillsError ? (
                <span className="flex flex-col items-start gap-2">
                  <span role="alert" className="text-xs font-medium text-badge">
                    {skillsError}
                  </span>
                  <button
                    type="button"
                    onClick={loadSkills}
                    className="pressable cursor-pointer text-xs font-medium text-ink underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    {t("modal.tryAgain")}
                  </button>
                </span>
              ) : visibleSkills.length === 0 ? (
                <p className="text-xs text-muted">
                  {t("modal.noSkillsYet")}
                </p>
              ) : (
                <>
                  {visibleSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className={
                        "flex items-center rounded-full text-xs font-medium " +
                        (selectedSkills.has(skill.id)
                          ? "bg-accent text-on-accent"
                          : "border border-line text-ink")
                      }
                    >
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        disabled={deletingSkillId === skill.id}
                        className="pressable flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed"
                      >
                        {skill.scope === "system" &&
                          SYSTEM_SKILL_ICONS[skill.name] && (
                            <Icon
                              name={SYSTEM_SKILL_ICONS[skill.name]}
                              size={13}
                            />
                          )}
                        {skill.name}
                      </button>
                      {skill.scope === "private" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSkillError(null);
                            setPendingDeleteSkill(skill);
                          }}
                          disabled={deletingSkillId === skill.id}
                          aria-label={t("modal.deleteSkillAria", { name: skill.name })}
                          title={t("modal.deleteSkillAria", { name: skill.name })}
                          className={
                            "pressable mr-1 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 " +
                            (selectedSkills.has(skill.id)
                              ? "text-on-accent"
                              : "text-muted hover:text-ink")
                          }
                        >
                          <Icon name="x" size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                </>
              )}
            </div>
            {/* Delete confirm (audit P2-10): tapping the x on an own
                skill asks here first — no window.confirm anywhere else
                in the app, so the modal keeps its inline style. */}
            {pendingDeleteSkill && (
              <div
                role="alert"
                className="flex flex-wrap items-center gap-2 rounded-lg bg-surface px-4 py-3"
              >
                <p className="min-w-0 flex-1 text-xs font-medium text-ink">
                  {t("modal.deleteSkillConfirm", { name: pendingDeleteSkill.name })}
                </p>
                <button
                  type="button"
                  onClick={confirmDeleteSkill}
                  disabled={deletingSkillId === pendingDeleteSkill.id}
                  className="pressable cursor-pointer rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingSkillId === pendingDeleteSkill.id
                    ? t("modal.deleting")
                    : t("common.delete")}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteSkill(null)}
                  disabled={deletingSkillId === pendingDeleteSkill.id}
                  className="pressable cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
            {skillError && (
              <p role="alert" className="text-xs font-medium text-badge">
                {skillError}
              </p>
            )}
          </div>

          {/* Team size */}
          {/* P1-D #22: this block previously rendered a static count with
              setRoleCount never called, so every submission hard-coded
              slotsTotal = 2. It is now a working stepper (1–10 open slots)
              and the copy reads "Team size" (was the broken
              "How many Role do you want to ?"). */}
          <div className="flex flex-col gap-3 mt-3">
            <label
              htmlFor="team-size-stepper"
              className="text-base font-medium"
            >
              {t("modal.teamSizeLabel")}
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="team-size-stepper"
                  aria-label={t("modal.fewerMembers")}
                  disabled={roleCount <= 1}
                  onClick={() => setRoleCount((c) => Math.max(1, c - 1))}
                  className="pressable flex size-8 cursor-pointer items-center justify-center rounded-full border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="min-w-[52px] text-center text-sm font-medium">
                  {roleCount}
                </span>
                <button
                  type="button"
                  aria-label={t("modal.moreMembers")}
                  disabled={roleCount >= 10}
                  onClick={() => setRoleCount((c) => Math.min(10, c + 1))}
                  className="pressable flex size-8 cursor-pointer items-center justify-center rounded-full border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <span className="text-xs text-muted">
                {roleCount === 1
                  ? t("modal.memberCountOne")
                  : t("modal.memberCountMany", { count: roleCount })}
              </span>
            </div>
            {/* Owner slot + the open slots implied by the current count. */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar size={32} alt={ownerName} src={sessionUser?.photo} />
                <div className="flex flex-col">
                  <span className="text-base font-medium">{ownerName}</span>
                  <span className="text-2xs text-muted">{t("modal.ownerRole")}</span>
                </div>
              </div>
              {Array.from({ length: Math.max(0, roleCount - 1) }).map(
                (_, i) => (
                  <div key={`open-${i}`} className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-placeholder">
                      <Icon name="plus" size={14} className="text-ink" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-medium">{t("modal.openSlot")}</span>
                      <span className="text-2xs text-muted">{t("modal.waiting")}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Photo / File attachments */}
          <div className="flex items-center gap-4">
            {/* Hidden input — "Photo" button triggers it */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              aria-label={t("modal.uploadPhotos")}
              onChange={handlePhotoChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="pressable flex cursor-pointer items-center gap-1 text-base font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="image-add" size={20} />
              {t("modal.photo")}
            </button>
            {/* P1-C #18: the "File" paperclip had no onClick / no hidden
                input — removed until non-image attachments exist. The
                TODO(backend) note stays here for the /api/upload hook:
                reuse the same hidden-input pattern with a permissive
                accept attribute (any file type). */}
          </div>
          {photoError && (
            <p className="text-xs font-medium text-badge" role="alert">
              {photoError}
            </p>
          )}
          {/* Photo preview: only shown when photos exist */}
          {photos.length > 0 && (
            <div className="flex gap-2">
              {photos.map((photo, i) => (
                <div key={photo.url} className="relative size-[100px] rounded-lg">
                  {/* Plain <img> — blob: URLs are not supported by next/image. */}
                  <img
                    src={photo.url}
                    alt={t("modal.photoPreviewAlt", { n: i + 1 })}
                    className="size-[100px] rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={t("modal.removePhotoAria", { n: i + 1 })}
                    className="pressable absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-bg focus-visible:ring-2 focus-visible:ring-bg focus-visible:outline-none"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          </div>

          {/* Pinned submit footer — stays visible while the
              form scrolls (drawer pattern, user order
              2026-11-13). The submit error rides with it. */}
          <div className="shrink-0 border-t border-line px-6 py-4">
            {submitError && (
              <p className="mb-3 text-xs font-medium text-badge" role="alert">
                {submitError}
              </p>
            )}
            <Button
              type="submit"
              label={editing ? t("modal.saveChanges") : t("modal.createProject")}
              variant="primary"
              size="lg"
              width="100%"
              icon={<Icon name={editing ? "check" : "send"} size={20} />}
              isLoading={submitting}
              isDisabled={submitting || selectedSkills.size === 0}
            />
          </div>
        </form>
      </div>
    </div>
  );
}