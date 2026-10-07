"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
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

/**
 * "Make Collaborations" modal (Figma "modal-make collaborations" frame).
 * GSAP open/close: opacity + scale 0.96->1, 280ms power3.out / 220ms power2.in.
 * Typo fix: "Make Costoms Role" -> "Make Custom Role".
 */
export function MakeCollabModal({ open, onClose }: MakeCollabModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [roleCount, setRoleCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  // GSAP open/close animation
  useEffect(() => {
    if (!overlayRef.current || !modalRef.current) return;
    if (open) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: "power3.out" }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.22,
        ease: "power2.in",
      });
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.96,
        duration: 0.22,
        ease: "power2.in",
      });
    }
  }, [open]);

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
    setSubmitting(true);
    // TODO(backend): POST /api/collaborations with form data
    await createCollabProject({
      title,
      description,
      skills: SKILL_OPTIONS.filter((s) => selectedSkills.has(s.id)),
      slotsTotal: roleCount,
    });
    setSubmitting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar max-h-[90vh] w-[596px] overflow-y-auto rounded-lg bg-bg p-6"
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
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer"
          >
            <Icon name="x" size={24} className="text-ink" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-base font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
              className="rounded-lg bg-surface px-4 py-3 text-base font-medium text-ink outline-none placeholder:text-muted"
            />
          </div>

          {/* Descriptions */}
          <div className="flex flex-col gap-1">
            <label className="text-base font-medium">Descriptions</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descriptions"
              required
              rows={3}
              className="resize-none rounded-lg bg-surface px-4 py-3 text-base font-medium text-ink outline-none placeholder:text-muted"
            />
          </div>

          {/* Roles / Skills */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium">
              What Role do you want to find?
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={
                    selectedSkills.has(skill.id)
                      ? "flex cursor-pointer items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink"
                      : "flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink"
                  }
                >
                  {skill.icon && <Icon name={skill.icon} size={14} />}
                  {skill.label}
                </button>
              ))}
            </div>
            {/* Make Custom Role (typo fixed from "Make Costoms Role") */}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface px-4 py-3"
            >
              <span className="flex size-6 items-center justify-center rounded-sm bg-accent">
                <Icon name="plus" size={14} className="text-ink" />
              </span>
              <span className="text-base font-medium text-muted">
                Make Custom Role
              </span>
            </button>
          </div>

          {/* Team size */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium">
              How many Role do you want to ?
            </label>
            <div className="flex items-center gap-3">
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
              {/* Counter */}
              <div className="ml-auto flex items-center gap-1">
                <span className="text-sm font-medium">{roleCount}</span>
                <Icon name="group" size={20} className="text-ink" />
              </div>
            </div>
          </div>

          {/* Photo / File attachments */}
          <div className="flex items-center gap-4">
            {/* TODO(backend): POST /api/upload for photo attachments */}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 text-base font-medium text-muted"
            >
              <Icon name="image-add" size={20} />
              Photo
            </button>
            {/* TODO(backend): POST /api/upload for file attachments */}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 text-base font-medium text-muted"
            >
              <Icon name="paperclip" size={20} />
              File
            </button>
          </div>

          {/* Photo preview placeholders (5 black squares from design) */}
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="size-[100px] rounded-lg bg-ink" />
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent py-3 text-base font-medium text-ink transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            <Icon name="send" size={20} />
            Make Collaborations
          </button>
        </form>
      </div>
    </div>
  );
}