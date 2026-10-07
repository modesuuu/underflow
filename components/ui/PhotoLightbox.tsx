"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Icon } from "@/components/ui/Icon";

/**
 * Generic photo lightbox (moved here from features/dashboard — shared by
 * feeds and collaborations). A photo only needs { url?, alt }: a missing
 * url renders the lime placeholder frame.
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.22,
        ease: "power2.in",
        onComplete: onClose,
      });
      if (frameRef.current) {
        gsap.to(frameRef.current, { scale: 0.96, duration: 0.22, ease: "power2.in" });
      }
    } else {
      onClose();
    }
  }, [closing, onClose]);

  // Open animation.
  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: "power3.out" }
      );
    }
    if (frameRef.current) {
      gsap.fromTo(
        frameRef.current,
        { scale: 0.96 },
        { scale: 1, duration: 0.28, ease: "power3.out" }
      );
    }
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

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-8"
    >
      <div
        ref={frameRef}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-3xl items-center justify-center"
      >
        {photo.url ? (
          <img
            src={photo.url}
            alt={photo.alt}
            className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
          />
        ) : (
          <div aria-label={photo.alt} className="aspect-[4/3] w-full rounded-lg bg-accent" />
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
            className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80"
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
        className="absolute right-4 top-4 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80"
      >
        <Icon name="x" size={20} />
      </button>
    </div>
  );
}
