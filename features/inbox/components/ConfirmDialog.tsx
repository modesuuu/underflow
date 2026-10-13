"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation for the inbox's destructive actions — a direct
 * build of Figma Frame 581 (the modal drawn next to the Inbox
 * frame): white card, radius 24, padding 24, red alert-circle
 * beside the title, a neutral gray Cancel pill and a red
 * (#ff383c) confirm pill. Backdrop click and Escape cancel; the
 * safe action (Cancel) takes initial focus so Enter never
 * destroys by accident.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[320px] flex-col gap-4 rounded-3xl bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Icon
            name="error-circle"
            size={24}
            className="shrink-0 text-[#ff383c]"
          />
          <h3 className="text-lg font-bold text-ink">{title}</h3>
        </div>
        <p className="text-sm text-muted">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="cursor-pointer rounded-xl bg-bg px-4 py-2 text-sm font-medium text-[#6d6c6a] transition-colors hover:bg-line/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-xl bg-[#ff383c] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
