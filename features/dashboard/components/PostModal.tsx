"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { createPost } from "../api";

/** Hosts next/image can render (next.config.ts remotePatterns). */
const PREVIEWABLE_HOSTS = ["res.cloudinary.com", "lh3.googleusercontent.com"];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPreviewable(value: string): boolean {
  try {
    return PREVIEWABLE_HOSTS.includes(new URL(value).hostname);
  } catch {
    return false;
  }
}

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
 * optional pasted URLs (no upload endpoint yet). On success the feed
 * refreshes via router.refresh() and the new post appears at the top.
 */
export function PostModal({ onClose }: PostModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canPost =
    title.trim() !== "" && description.trim() !== "" && !submitting;

  function addImage() {
    const url = urlDraft.trim();
    if (!isHttpUrl(url)) {
      setUrlError("Paste a valid image URL starting with http:// or https://.");
      return;
    }
    if (images.includes(url)) {
      setUrlError("That image is already added.");
      return;
    }
    setImages([...images, url]);
    setUrlDraft("");
    setUrlError(null);
  }

  async function submit() {
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPost({
        title: title.trim(),
        description: description.trim(),
        media_urls: images,
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
          <div className="flex gap-2">
            <input
              type="url"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                setUrlError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addImage();
                }
              }}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="Paste an image URL"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={urlDraft.trim() === ""}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="plus" size={16} />
              Add
            </button>
          </div>
          {urlError && (
            <p className="text-sm text-badge">{urlError}</p>
          )}
          {images.length > 0 && (
            <ul className="flex flex-col gap-2">
              {images.map((url) => (
                <li
                  key={url}
                  className="flex items-center gap-3 rounded-xl border border-line p-2"
                >
                  {isPreviewable(url) ? (
                    <Image
                      src={url}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-bg text-muted">
                      <Icon name="link" size={20} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setImages(images.filter((item) => item !== url))
                    }
                    aria-label="Remove image"
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
