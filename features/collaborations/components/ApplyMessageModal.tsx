"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface ApplyMessageModalProps {
  projectTitle: string;
  ownerName: string;
  /** Role text derived from the project's need line, e.g. "Frontend". */
  roleLabel: string;
  sending: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

/**
 * Applying IS messaging the owner (the product flow): this modal
 * collects the applicant's first message — prefilled from the
 * project's need line, fully editable — and sending it both files
 * the application and opens the Inbox thread with the owner.
 */
export function ApplyMessageModal({
  projectTitle,
  ownerName,
  roleLabel,
  sending,
  onClose,
  onSend,
}: ApplyMessageModalProps) {
  const [message, setMessage] = useState(
    `Hi! I'd like to apply as ${roleLabel} for ${projectTitle}. `,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Apply to ${projectTitle}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">
              Apply to {projectTitle}
            </h2>
            <p className="text-sm text-muted">
              Your application is sent as a message to {ownerName} and
              starts a conversation in your Inbox.
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
          <span className="text-sm font-medium text-ink">
            Message to {ownerName}
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            autoFocus
            className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Introduce yourself, your experience, and how much time you can commit…"
          />
        </label>

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
            onClick={() => onSend(message)}
            disabled={!message.trim() || sending}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="send" size={18} />
            {sending ? "Sending…" : "Send application"}
          </button>
        </div>
      </div>
    </div>
  );
}
