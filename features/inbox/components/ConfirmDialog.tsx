"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation for the inbox's destructive actions (Clear chat,
 * Delete chat). Backdrop click and Escape cancel; the safe action
 * (Cancel) takes initial focus so Enter never destroys by accident.
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
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-full bg-[#ff383c] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
