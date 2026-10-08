"use client";

import { useState } from "react";
import { PhotoGrid, type Photo } from "@/components/ui/PhotoGrid";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";

interface PhotoViewerProps {
  photos: Photo[];
}

export function PhotoViewer({ photos }: PhotoViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <PhotoGrid photos={photos} onPhotoClick={setOpenIndex} />
      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}