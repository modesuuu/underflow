"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { createPost, updatePost, uploadImage } from "../api";
import type { Post } from "../types";

/** A picked image file + its local preview URL (URL.createObjectURL). */
interface ImageDraft {
  file: File;
  url: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per file (matches /api/upload)

/** Pull the backend's own message out of ApiError's prefixed text. */
function friendlyMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const match = /^API request failed: \d+ (?:\([^)]*\) )?(.+?) \([^)]*\)$/.exec(
      err.message,
    );
    if (match) return match[1];
    return err.message;
  }
  return err instanceof Error
    ? err.message
    : "Something went wrong. Please try again.";
}

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the modal edits this post (description only). */
  editing?: Post | null;
  /** Edit mode only: fired with the saved description before close. */
  onUpdated?: (description: string) => void;
}

/**
 * "Post Something" composer — visual design follows MakeCollabModal
 * (same overlay, panel, header, borderless surface inputs, photo tiles,
 * full-width submit). Text-only by default — images are optional files
 * picked from the device and uploaded to Cloudinary (POST /api/upload)
 * before the post is created. On success the feed refreshes via
 * router.refresh() and the new post appears at the top.
 */
export function PostModal({ open, onClose, editing, onUpdated }: PostModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Exit animation state — modal stays mounted until the CSS out-animation
  // finishes (same pattern as MakeCollabModal).
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  // Edit mode: every open starts from the post's current description,
  // so an abandoned edit never leaks into the next session.
  useEffect(() => {
    if (!open || !editing) return;
    setDescription(editing.text);
    setImages([]);
    setImageError(null);
    setError(null);
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

  // Track live blob URLs in a ref so the unmount cleanup revokes exactly
  // the ones still open (removed entries are already revoked inline).
  const imageUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      imageUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canPost = description.trim() !== "" && !submitting;

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-selecting the same file
    setImageError(null);

    const accepted: ImageDraft[] = [];
    let rejectedReason: string | null = null;
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        rejectedReason = "Only image files are allowed.";
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        rejectedReason = "Max 5 MB per image.";
        continue;
      }
      if (images.length + accepted.length >= MAX_IMAGES) {
        rejectedReason = `Max ${MAX_IMAGES} images.`;
        break;
      }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) {
      const next = [...images, ...accepted];
      setImages(next);
      imageUrlsRef.current = next.map((item) => item.url);
    }
    if (rejectedReason) setImageError(rejectedReason);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (removed) {
        URL.revokeObjectURL(removed.url);
        imageUrlsRef.current = next.map((item) => item.url);
      }
      return next;
    });
    setImageError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        // Description only — no media fields are sent, so the post's
        // photos stay exactly as they are.
        await updatePost(editing.id, { description: description.trim() });
        toast.success("Post updated");
        onUpdated?.(description.trim());
        setSubmitting(false);
        requestClose();
        return;
      }
      // Upload the picked files first; only when every upload
      // succeeded is the post created with their URLs.
      const uploaded =
        images.length > 0
          ? await Promise.all(images.map((item) => uploadImage(item.file)))
          : [];
      await createPost({
        description: description.trim(),
        media_urls: uploaded.map((item) => item.url),
        media_public_ids: uploaded.map((item) => item.public_id),
      });
      toast.success("Post published");
      router.refresh();
      requestClose();
    } catch (err) {
      setError(friendlyMessage(err));
      setSubmitting(false);
    }
  }

  if (!open && !closing) return null;

  // Portaled out of the TopBar: same reason as ApplyMessageModal —
  // the modal must paint above the TopBar (z-20), so it lives in the
  // root context at z-50.
  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4",
        closing ? "modal-overlay-out" : "modal-overlay-in",
      )}
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-something-title"
        className={clsx(
          "no-scrollbar max-h-[90vh] w-full max-w-[596px] overflow-y-auto rounded-lg bg-bg p-6",
          closing ? "modal-panel-out" : "modal-panel-in",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 id="post-something-title" className="text-2xl font-medium">
              {editing ? "Edit Post" : "Post Something"}
            </h2>
            <p className="mt-1 text-xs font-medium text-muted">
              {editing
                ? "Only the description can be changed."
                : "Share what you are working on with the community."}
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
          {/* Description */}
          <div className="flex flex-col gap-1">
            <label htmlFor="post-desc-input" className="text-base font-medium">
              Description
            </label>
            <textarea
              id="post-desc-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              autoFocus
              rows={3}
              placeholder="Description"
              className="resize-none rounded-lg bg-surface px-4 py-3 text-base font-medium text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {/* Photo attachments (create only — editing changes the
              description and nothing else) */}
          {!editing && (
            <div className="flex items-center gap-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                aria-label="Choose images"
                onChange={handleImageChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="pressable flex cursor-pointer items-center gap-1 text-base font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="image-add" size={20} />
                Photo
              </button>
            </div>
          )}
          {imageError && (
            <p className="text-xs font-medium text-badge" role="alert">
              {imageError}
            </p>
          )}
          {/* Photo preview: only shown when images exist */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((item, index) => (
                <div key={item.url} className="relative size-[100px] rounded-lg">
                  {/* Plain <img> — blob: URLs are not supported by next/image. */}
                  <img
                    src={item.url}
                    alt={`Image preview ${index + 1}`}
                    className="size-[100px] rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="pressable absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-bg focus-visible:ring-2 focus-visible:ring-bg focus-visible:outline-none"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          {error && (
            <p className="text-xs font-medium text-badge" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!canPost}
            className="pressable flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent py-3 text-base font-medium text-on-accent transition-opacity hover:opacity-85 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name={editing ? "check" : "send"} size={20} />
            {submitting
              ? editing
                ? "Saving…"
                : "Posting…"
              : editing
                ? "Save changes"
                : "Post"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
