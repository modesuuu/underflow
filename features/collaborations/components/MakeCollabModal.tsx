"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { toast } from "sonner";
import { backendErrorMessage, createCollabProject } from "../api";
import { createSkill, deleteSkill, getSkills, type Skill } from "../skills-api";
import { ApiError } from "@/lib/api-client";

interface MakeCollabModalProps {
  open: boolean;
  onClose: () => void;
}

/** Max photo upload constraints (matches 5-slot design). */
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB per file

/** The template role tags are the backend's static system skills
 *  (scope "system": visible to everyone, cannot be deleted). This map
 *  only gives each of them its icon; its key order is the display
 *  order (the mockup's original order). */
const SYSTEM_SKILL_ICONS: Record<string, string> = {
  Coding: "code-alt",
  "UI Design": "palette",
  Backend: "server",
  Testing: "bug",
  DevOps: "terminal",
  Mobile: "mobile-alt",
  Data: "bar-chart-alt-2",
  Writing: "pencil",
};
const SYSTEM_SKILL_ORDER = Object.keys(SYSTEM_SKILL_ICONS);

/** A selected photo with an instant blob: preview URL. */
interface PhotoDraft {
  file: File;
  url: string;
}

export function MakeCollabModal({ open, onClose }: MakeCollabModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  // P1-C #17: remember the trigger that opened the modal so focus can be
  // restored on close.
  const previousFocusRef = useRef<HTMLElement | null>(null);
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
    try {
      await createAndSelectSkill(name);
      setSkillDraft("");
    } catch (err) {
      setSkillError(
        err instanceof Error ? err.message : "Could not add this skill."
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
          : "Could not delete this skill."
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
    if (!title.trim()) errors.title = "Title is required.";
    if (!description.trim()) errors.description = "Description is required.";
    if (errors.title || errors.description) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    // Photos are uploaded inside createCollabProject (POST /api/upload);
    // an upload failure throws, shows inline, and keeps the draft.
    const photoFiles = photos.map((p) => p.file);
    try {
      await createCollabProject({
        title: title.trim(),
        description: description.trim(),
        skillIds: [...selectedSkills],
        slotsTotal: roleCount,
        dueDate,
        photos: photoFiles,
      });
    } catch (err) {
      setSubmitting(false);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Could not create the project. Please try again."
      );
      return;
    }
    setSubmitting(false);
    setClosing(false);
    toast.success("Collaboration posted", {
      description: `"${title.trim()}" is now on the board.`,
    });
    onClose();
  };

  if (!open && !closing) return null;

  return (
    <div
      ref={overlayRef}
      onClick={requestClose}
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4",
        closing ? "modal-overlay-out" : "modal-overlay-in"
      )}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="make-collab-title"
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "no-scrollbar max-h-[90vh] w-full max-w-[596px] overflow-y-auto rounded-lg bg-bg p-6",
          closing ? "modal-panel-out" : "modal-panel-in"
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 id="make-collab-title" className="text-2xl font-medium">
              Create Project
            </h2>
            <p className="mt-1 text-xs font-medium text-muted">
              Find your team, build your portfolio, ship real projects.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="pressable cursor-pointer rounded-md p-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="x" size={24} className="text-ink" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label htmlFor="make-collab-title-input" className="text-base font-medium">Title</label>
            <input
              id="make-collab-title-input"
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title)
                  setFieldErrors((f) => ({ ...f, title: undefined }));
              }}
              placeholder="Title"
              required
              aria-invalid={fieldErrors.title ? true : undefined}
              className="rounded-lg bg-surface px-4 py-3 text-base font-medium text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            />
            {fieldErrors.title && (
              <p role="alert" className="text-xs font-medium text-badge">
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Descriptions */}
          <div className="flex flex-col gap-1">
            <label htmlFor="make-collab-desc-input" className="text-base font-medium">Descriptions</label>
            <textarea
              id="make-collab-desc-input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description)
                  setFieldErrors((f) => ({ ...f, description: undefined }));
              }}
              placeholder="Descriptions"
              required
              rows={3}
              aria-invalid={fieldErrors.description ? true : undefined}
              className="resize-none rounded-lg bg-surface px-4 py-3 text-base font-medium text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            />
            {fieldErrors.description && (
              <p role="alert" className="text-xs font-medium text-badge">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Due date (optional). There is deliberately no Type field:
              the project type is never shown anywhere in the app, so
              asking for it here was pointless. The backend stores its
              default. */}
          <div className="flex flex-col gap-1">
            <label htmlFor="make-collab-due-input" className="text-base font-medium">Due date</label>
            <input
              id="make-collab-due-input"
              type="date"
              value={dueDate}
              min={new Date().toLocaleDateString("en-CA")}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg bg-surface px-4 py-3 text-base font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {/* Roles / Skills */}
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium">
              What Role do you want to find?
            </label>
            {/* The one and only skill input: whatever is typed here becomes
                a private skill (POST /api/skills) and is selected as a role
                for this project. The old separate "Make Custom Role" field
                did exactly the same thing, so it was removed. */}
            <div className="flex items-center gap-2 rounded-lg bg-surface px-4 py-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent">
              <input
                type="text"
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={handleSkillKey}
                placeholder="Add a skill"
                aria-label="Add a skill"
                className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={!skillDraft.trim() || creatingSkill}
                aria-label="Add skill"
                className="pressable flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-accent text-on-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Icon name="plus" size={14} className="text-ink" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {skillsLoading ? (
                <p className="text-xs text-muted">Loading your skills…</p>
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
                    Try again
                  </button>
                </span>
              ) : visibleSkills.length === 0 ? (
                <p className="text-xs text-muted">
                  You don&apos;t have any skills yet — add your first one above.
                </p>
              ) : (
                <>
                  {visibleSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className={
                        "flex items-center rounded-full text-xs font-medium text-ink " +
                        (selectedSkills.has(skill.id)
                          ? "bg-accent"
                          : "border border-line")
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
                          aria-label={`Delete skill ${skill.name}`}
                          title={`Delete skill ${skill.name}`}
                          className="pressable mr-1 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
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
                  Delete skill &ldquo;{pendingDeleteSkill.name}&rdquo;? It
                  will be removed from your skills.
                </p>
                <button
                  type="button"
                  onClick={confirmDeleteSkill}
                  disabled={deletingSkillId === pendingDeleteSkill.id}
                  className="pressable cursor-pointer rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingSkillId === pendingDeleteSkill.id
                    ? "Deleting…"
                    : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteSkill(null)}
                  disabled={deletingSkillId === pendingDeleteSkill.id}
                  className="pressable cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
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
              Team size
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="team-size-stepper"
                  aria-label="Fewer team members"
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
                  aria-label="More team members"
                  disabled={roleCount >= 10}
                  onClick={() => setRoleCount((c) => Math.min(10, c + 1))}
                  className="pressable flex size-8 cursor-pointer items-center justify-center rounded-full border border-line text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <span className="text-xs text-muted">
                {roleCount === 1 ? "1 member" : `${roleCount} members`}
              </span>
            </div>
            {/* Owner slot + the open slots implied by the current count. */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-placeholder" />
                <div className="flex flex-col">
                  <span className="text-base font-medium">Russel</span>
                  <span className="text-2xs text-muted">
                    Owner • Fullstack
                  </span>
                </div>
              </div>
              {Array.from({ length: Math.max(0, roleCount - 1) }).map(
                (_, i) => (
                  <div key={`open-${i}`} className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-placeholder">
                      <Icon name="plus" size={14} className="text-ink" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-medium">Open slot</span>
                      <span className="text-2xs text-muted">Waiting....</span>
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
              aria-label="Upload photos"
              onChange={handlePhotoChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="pressable flex cursor-pointer items-center gap-1 text-base font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="image-add" size={20} />
              Photo
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
                    alt={`Photo preview ${i + 1}`}
                    className="size-[100px] rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="pressable absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-bg focus-visible:ring-2 focus-visible:ring-bg focus-visible:outline-none"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          {submitError && (
            <p className="text-xs font-medium text-badge" role="alert">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || selectedSkills.size === 0}
            className="pressable flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent py-3 text-base font-medium text-on-accent transition-opacity hover:opacity-85 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="send" size={20} />
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
}