"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Generic photo lightbox (shared by feeds and collaborations). A photo only
 * needs { url?, alt }: a missing url renders the lime placeholder frame.
 *
 * Motion: the shared CSS keyframes (.modal-overlay-* and .modal-panel-* in
 * globals.css, audit P1-E #24) replace the old GSAP tweens — same opacity /
 * scale, gated behind prefers-reduced-motion for free, and exits use the
 * ease-out token faster than the open (P1-E #25).
 *
 * Accessibility (P1-C #17): focus moves into the dialog on open, is trapped
 * while open (Tab / Shift-Tab stay inside), and returns to the trigger on
 * close. Esc closes; arrows navigate.
 */
export interface LightboxPhoto {
  url?: string;
  alt: string;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  startIndex: number;
  onClose: () => void;
}

export function PhotoLightbox({ photos, startIndex, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const [closing, setClosing] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Reset the broken-image flag whenever the visible photo changes.
  useEffect(() => {
    setImgBroken(false);
  }, [index]);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    // The CSS out-animation is 180ms; hold the mount until it finishes so
    // reduced-motion users (animation gated off -> instant) still unmount
    // cleanly. The timeout also covers that no-animation path.
    window.setTimeout(onClose, 220);
  }, [closing, onClose]);

  // Open: move focus into the dialog and remember the trigger for restore.
  useEffect(() => {
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    overlayRef.current?.focus();
  }, []);

  // Close: return focus to whatever opened the lightbox.
  useEffect(() => {
    if (!closing) return;
    return () => {
      prevFocusRef.current?.focus?.();
    };
  }, [closing]);

  // Trap Tab inside the dialog while open.
  useEffect(() => {
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !overlayRef.current) return;
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
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
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (photos.length > 1) {
        if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
        if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, photos.length]);

  const photo = photos[index];
  // P1-C #19: a broken image (onError) or missing URL falls back to the
  // placeholder frame.
  const showImage = !!photo.url && !imgBroken;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      tabIndex={-1}
      onClick={close}
      className={
        "fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-8 focus:outline-none " +
        (closing ? "modal-overlay-out" : "modal-overlay-in")
      }
    >
      <div
        ref={frameRef}
        onClick={(e) => e.stopPropagation()}
        className={
          "flex w-full max-w-3xl items-center justify-center " +
          (closing ? "modal-panel-out" : "modal-panel-in")
        }
      >
        {showImage ? (
          <img
            src={photo.url}
            alt={photo.alt}
            onError={() => setImgBroken(true)}
            className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
          />
        ) : (
          <div
            role="img"
            aria-label={photo.alt}
            className="flex aspect-[4/3] max-h-[80vh] w-full items-center justify-center rounded-lg bg-bg"
          >
            <Icon name="image-add" size={48} className="text-ink/40" />
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + photos.length) % photos.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="chevron-left" size={24} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % photos.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="chevron-right" size={24} />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-2xs font-medium text-white">
            {index + 1} / {photos.length}
          </span>
        </>
      )}

      {/* Close */}
      <button
        type="button"
        aria-label="Close preview"
        onClick={close}
        className="absolute right-4 top-4 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="x" size={20} />
      </button>
    </div>
  );
}
