"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The ••• menu on a comment (byline row, right side) — the same
 * glyph, dropdown and close behaviour as PostOptionsMenu, one step
 * quieter to match the comment surface. Holds the comment-level
 * actions: Report (the parent turns it into the report form, then
 * the reported notice). Closes on outside click and on Escape.
 */
export function CommentOptionsMenu({ onReport }: { onReport: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={t("post.commentOptions")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
      >
        <Icon name="dots-horizontal-rounded" size={20} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t("post.commentOptions")}
          className="absolute top-full right-0 z-30 mt-1 min-w-44 rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onReport();
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-bg"
          >
            <Icon name="flag" size={18} />
            {t("post.reportComment")}
          </button>
        </div>
      )}
    </div>
  );
}
