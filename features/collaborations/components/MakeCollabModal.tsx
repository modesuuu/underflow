"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { createCollabProject } from "../api";
import type { SkillTag } from "../types";

const SKILL_OPTIONS: SkillTag[] = [
  { id: "s1", label: "Coding", icon: "code-alt" },
  { id: "s2", label: "UI Design", icon: "palette" },
  { id: "s3", label: "Backend", icon: "server" },
  { id: "s4", label: "Testing", icon: "bug" },
  { id: "s5", label: "DevOps", icon: "terminal" },
  { id: "s6", label: "Mobile", icon: "mobile-alt" },
  { id: "s7", label: "Data", icon: "bar-chart-alt-2" },
  { id: "s8", label: "Writing", icon: "pencil" },
];

interface MakeCollabModalProps {
  open: boolean;
  onClose: () => void;
}

/** Max photo upload constraints (matches 5-slot design). */
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB per file

/** A selected photo with an instant blob: preview URL. */
interface PhotoDraft {
  file: File;
  url: string;
}

export function MakeCollabModal({ open, onClose }: MakeCollabModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [roleCount, setRoleCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [roleDraft, setRoleDraft] = useState("");
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

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setClosing(false), 260);
    return () => clearTimeout(t);
  }, [closing]);

  const requestClose = () => {
    setClosing(true);
    onClose();
  };

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

  const addCustomRole = () => {
    const value = roleDraft.trim();
    if (!value) return;
    const isDuplicate = customRoles.some(
      (r) => r.toLowerCase() === value.toLowerCase()
    );
    if (isDuplicate) {
      setRoleDraft("");
      return;
    }
    setCustomRoles((prev) => [...prev, value]);
    setRoleDraft("");
  };

  const removeCustomRole = (index: number) => {
    setCustomRoles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRoleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomRole();
    } else if (e.key === "Escape") {
      setRoleDraft("");
    }
  };

  // P2: open/close animations are CSS keyframes (globals.css .modal-*-in/out),
  // gated behind prefers-reduced-motion. GSAP was dropped for this trivial
  // opacity/scale use — CSS is simpler and cheaper; GSAP stays for the
  // sidebar pill motion which has real path/choreography.

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    // TODO(backend): POST /api/collaborations with form data
    // TODO(backend): POST /api/upload for the selected photo Files,
    // then include returned URLs in the project payload.
    const photoFiles = photos.map((p) => p.file);
    await createCollabProject({
      title: title.trim(),
      description: description.trim(),
      skills: SKILL_OPTIONS.filter((s) => selectedSkills.has(s.id)),
      slotsTotal: roleCount,
      photos: photoFiles,
      customRoles,
    });
    setSubmitting(false);
    setClosing(false);
    onClose();
  };

  if (!open && !closing) return null;

  return (
    <div
      ref={overlayRef}
      onClick={requestClose}
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-ink/60",
        closing ? "modal-overlay-out" : "modal-overlay-in"
      )}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "no-scrollbar max-h-[90vh] w-[596px] overflow-y-auto rounded-lg bg-bg p-6",
          closing ? "modal-panel-out" : "modal-panel-in"
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-medium">Make Collaborations</h2>
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
            <label className="text-base font-medium">Title</label>
            <input
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
            <label className="text-base font-medium">Descriptions</label>
            <textarea
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

          {/* Roles / Skills */}
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium">
              What Role do you want to find?
            </label>
            {/* Custom role: real input + add button (replaces dead "Make Custom Role") */}
            <div className="flex items-center gap-2 rounded-lg bg-surface px-4 py-3">
              <input
                type="text"
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value)}
                onKeyDown={handleRoleKey}
                placeholder="Make Custom Role"
                aria-label="Custom role"
                className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={addCustomRole}
                aria-label="Add custom role"
                className="pressable flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Icon name="plus" size={14} className="text-ink" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={
                    "pressable flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-ink " +
                    "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none " +
                    (selectedSkills.has(skill.id)
                      ? "bg-accent"
                      : "border border-line")
                  }
                >
                  {skill.icon && <Icon name={skill.icon} size={14} />}
                  {skill.label}
                </button>
              ))}
              {/* Custom roles render as accent-bg chips with a tag icon + remove */}
              {customRoles.map((role, i) => (
                <span
                  key={`role-${i}`}
                  className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink"
                >
                  <Icon name="purchase-tag" size={14} />
                  {role}
                  <button
                    type="button"
                    onClick={() => removeCustomRole(i)}
                    aria-label={`Remove ${role}`}
                    className="pressable ml-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Team size */}
          <div className="flex flex-col gap-3 mt-3">
            <label className="text-base font-medium">
              How many Role do you want to ?
            </label>
            <div className="flex items-center gap-3 justify-start">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{roleCount}</span>
                <Icon name="group" size={20} className="text-ink" />
              </div>
              {/* Owner slot */}
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-placeholder" />
                <div className="flex flex-col">
                  <span className="text-base font-medium">Russel</span>
                  <span className="text-2xs text-muted">
                    Owner • Fullstack
                  </span>
                </div>
              </div>
              {/* Open slot */}
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-placeholder">
                  <Icon name="plus" size={14} className="text-ink" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-medium">Open slot</span>
                  <span className="text-2xs text-muted">Waiting....</span>
                </div>
              </div>
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
            {/* TODO(backend): reuse the same hidden-input pattern for file
                attachments (non-image) once /api/upload exists. */}
            <button
              type="button"
              className="pressable flex cursor-pointer items-center gap-1 text-base font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Icon name="paperclip" size={20} />
              File
            </button>
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
          <button
            type="submit"
            disabled={submitting}
            className="pressable flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent py-3 text-base font-medium text-ink transition-opacity hover:opacity-85 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="send" size={20} />
            Make Collaborations
          </button>
        </form>
      </div>
    </div>
  );
}