"use client";

import { useState } from "react";
import clsx from "clsx";

/**
 * The shared `Photo` shape — one source of truth in `components/ui/` so both
 * the dashboard feed and the collab detail page reuse the exact same grid:
 * `{ id, url?, alt }`. A missing `url` (mock placeholder tokens like
 * "photo-1") renders the mist placeholder frame, never a broken <img>.
 */
export interface Photo {
  id: string;
  /** Absolute image URL; undefined renders the mist placeholder tile. */
  url?: string;
  alt: string;
}

interface TileProps {
  photo: Photo;
  overlayCount?: number;
  onClick?: () => void;
  className?: string;
}

/* A photo tile is mounted like a print laid on the pad: a hairline rule and
   the mist placeholder, no rounded accent block. */
function Tile({ photo, overlayCount = 0, onClick, className }: TileProps) {
  const [broken, setBroken] = useState(false);

  return (
    <button
      type="button"
      aria-label={photo.alt}
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        "relative overflow-hidden rounded-sm border border-rule bg-placeholder",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
        onClick && "cursor-pointer",
        className
      )}
    >
      {photo.url && !broken ? (
        <img
          src={photo.url}
          alt={photo.alt}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-placeholder">
          <i
            className="bx bx-image-add text-2xl text-ink/30"
            aria-hidden="true"
          />
        </span>
      )}
      {overlayCount > 0 && (
        <span className="font-figures absolute inset-0 flex items-center justify-center bg-ink/60 text-xl font-medium text-surface">
          +{overlayCount}
        </span>
      )}
    </button>
  );
}

interface PhotoGridProps {
  photos: Photo[];
  /**
   * Called with the photo index when a tile is clicked. Omit it to render
   * inert (non-clickable) tiles, e.g. a read-only gallery.
   */
  onPhotoClick?: (index: number) => void;
}

/**
 * Adaptive photo grid: 1 -> full-width; 2 -> two columns; 3 -> tall left +
 * two stacked right; 4+ -> 2x2 with a "+N" overlay on the fourth tile.
 * Height stays fixed so a sm:col-span-2 card cannot inflate it.
 */
export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  if (photos.length === 0) return null;

  const click = (index: number) =>
    onPhotoClick ? () => onPhotoClick(index) : undefined;

  if (photos.length === 1) {
    return (
      <div className="h-[306px] w-full">
        <Tile photo={photos[0]} onClick={click(0)} className="h-full w-full" />
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid h-[306px] grid-cols-2 gap-3">
        <Tile photo={photos[0]} onClick={click(0)} />
        <Tile photo={photos[1]} onClick={click(1)} />
      </div>
    );
  }

  if (photos.length === 3) {
    return (
      <div className="grid h-[306px] grid-cols-2 grid-rows-2 gap-3">
        <Tile photo={photos[0]} onClick={click(0)} className="row-span-2" />
        <Tile photo={photos[1]} onClick={click(1)} />
        <Tile photo={photos[2]} onClick={click(2)} />
      </div>
    );
  }

  const overflow = photos.length - 4;
  return (
    <div className="grid h-[306px] grid-cols-2 grid-rows-2 gap-3">
      <Tile photo={photos[0]} onClick={click(0)} />
      <Tile photo={photos[1]} onClick={click(1)} />
      <Tile photo={photos[2]} onClick={click(2)} />
      <Tile photo={photos[3]} onClick={click(3)} overlayCount={overflow} />
    </div>
  );
}