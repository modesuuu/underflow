"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { createPost, uploadImage } from "../api";

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
  onClose: () => void;
}

/**
 * "Post Something" composer. Text-only by default — images are
 * optional files picked from the device and uploaded to Cloudinary
 * (POST /api/upload) before the post is created. On success the feed
 * refreshes via router.refresh() and the new post appears at the top.
 */
export function PostModal({ onClose }: PostModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canPost =
    title.trim() !== "" && description.trim() !== "" && !submitting;

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

  async function submit() {
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      // Upload the picked files first; only when every upload
      // succeeded is the post created with their URLs.
      const uploaded =
        images.length > 0
          ? await Promise.all(images.map((item) => uploadImage(item.file)))
          : [];
      await createPost({
        title: title.trim(),
        description: description.trim(),
        media_urls: uploaded.map((item) => item.url),
        media_public_ids: uploaded.map((item) => item.public_id),
      });
      toast.success("Post published");
      router.refresh();
      onClose();
    } catch (err) {
      setError(friendlyMessage(err));
      setSubmitting(false);
    }
  }

  // Portaled out of the TopBar: same reason as ApplyMessageModal —
  // the modal must paint above the TopBar (z-20), so it lives in the
  // root context at z-50.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post Something"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">Post Something</h2>
            <p className="text-sm text-muted">
              Share what you are working on with the community.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            maxLength={120}
            className="w-full rounded-xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Give your post a title"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Share what you're working on…"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Images <span className="font-normal text-muted">(optional)</span>
          </span>
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
            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="image-add" size={16} />
            Add image
          </button>
          {imageError && (
            <p className="text-sm text-badge">{imageError}</p>
          )}
          {images.length > 0 && (
            <ul className="flex flex-col gap-2">
              {images.map((item, index) => (
                <li
                  key={item.url}
                  className="flex items-center gap-3 rounded-xl border border-line p-2"
                >
                  {/* Plain <img> — blob: URLs are not supported by next/image. */}
                  <img
                    src={item.url}
                    alt={`Image preview ${index + 1}`}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {item.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-badge">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canPost}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="send" size={18} />
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
