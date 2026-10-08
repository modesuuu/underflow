"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Photo } from "../types";

interface TileProps {
  photo: Photo;
  overlayCount?: number;
  onClick?: () => void;
  className?: string;
}

function Tile({ photo, overlayCount = 0, onClick, className }: TileProps) {
  const [broken, setBroken] = useState(false);

  return (
    <button
      type="button"
      aria-label={photo.alt}
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        "relative overflow-hidden rounded-md bg-accent",
        // P1-C #19: a keyboard-visible focus ring was missing on the tiles.
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* P1-C #19: a broken/missing URL paints a placeholder frame
          (the lime `bg-accent` tile + a small image icon) instead of a
          broken-image glyph. */}
      {photo.url && !broken ? (
        <img
          src={photo.url}
          alt={photo.alt}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-accent">
          <i className="bx bx-image-add text-2xl text-ink/40" aria-hidden="true" />
        </span>
      )}
      {overlayCount > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-medium text-white">
          +{overlayCount}
        </span>
      )}
    </button>
  );
}

interface PhotoGridProps {
  photos: Photo[];
  /**
   * Called with the photo index when a tile is clicked. The feed passes a
   * navigator to the post detail page; the detail page omits it (inert tiles).
   */
  onPhotoClick?: (index: number) => void;
}

/**
 * X-style adaptive photo grid (Figma 283:700, 306px tall, 20px gaps):
 * 1 photo  -> single full-width tile
 * 2 photos -> two columns
 * 3 photos -> one tall left + two stacked right
 * 4 photos -> 2x2
 * >4       -> 2x2 with a "+N" overlay on the 4th tile (N = remaining count)
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
      <div className="grid h-[306px] grid-cols-2 gap-5">
        <Tile photo={photos[0]} onClick={click(0)} />
        <Tile photo={photos[1]} onClick={click(1)} />
      </div>
    );
  }

  if (photos.length === 3) {
    return (
      <div className="grid h-[306px] grid-cols-2 grid-rows-2 gap-5">
        <Tile photo={photos[0]} onClick={click(0)} className="row-span-2" />
        <Tile photo={photos[1]} onClick={click(1)} />
        <Tile photo={photos[2]} onClick={click(2)} />
      </div>
    );
  }

  // 4+ : show the first four, overlay the remainder count on tile 4.
  const overflow = photos.length - 4;
  return (
    <div className="grid h-[306px] grid-cols-2 grid-rows-2 gap-5">
      <Tile photo={photos[0]} onClick={click(0)} />
      <Tile photo={photos[1]} onClick={click(1)} />
      <Tile photo={photos[2]} onClick={click(2)} />
      <Tile photo={photos[3]} onClick={click(3)} overlayCount={overflow} />
    </div>
  );
}