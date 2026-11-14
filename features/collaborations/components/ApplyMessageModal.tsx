"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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
  const { t } = useLanguage();
  const [message, setMessage] = useState(() =>
    t("collab.applyPrefill", { role: roleLabel, title: projectTitle }),
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portaled out of the card: the modal renders inside the card
  // footer's relative z-10 layer, which capped it below the
  // TopBar (z-20), so the TopBar painted above the backdrop.
  // In the root context its z-50 covers the TopBar, as a modal must.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("collab.applyToProject", { title: projectTitle })}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-lg bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">
              {t("collab.applyToProject", { title: projectTitle })}
            </h2>
            <p className="text-sm text-muted">
              {t("collab.applyModalBody", { name: ownerName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-bg"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <TextArea
          label={t("collab.messageToOwner", { name: ownerName })}
          value={message}
          onChange={(value) => setMessage(value)}
          rows={5}
          hasAutoFocus
          placeholder={t("collab.applyPlaceholder")}
        />

        <div className="flex justify-end gap-2">
          <Button label={t("common.cancel")} variant="secondary" onClick={onClose} />
          <Button
            label={sending ? t("common.sending") : t("collab.sendApplication")}
            variant="primary"
            icon={<Icon name="send" size={18} />}
            isLoading={sending}
            isDisabled={!message.trim() || sending}
            onClick={() => onSend(message)}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
