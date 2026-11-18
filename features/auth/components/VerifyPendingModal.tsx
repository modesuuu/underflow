"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { ApiError } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { resendVerificationPending } from "../api";

/**
 * Signup-page verification modal (pending scheme, 2026-11-16).
 * Shown right after a successful register response: no account
 * exists yet — it is created when the emailed link is clicked.
 * Closing returns to the form (e.g. to fix a mistyped email); the
 * pending registration itself waits server-side for 24 hours, and
 * signing up again with the same details resends the link.
 */
export function VerifyPendingModal({
  pendingId,
  email,
  onClose,
}: {
  pendingId: string;
  email: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await resendVerificationPending(pendingId);
      toast.success(t("verify.sent"));
    } catch (err) {
      if (err instanceof ApiError && err.code === "rate_limited") {
        toast.error(t("auth.errTooMany"));
      } else if (err instanceof ApiError && err.status === 502) {
        toast.error(t("verify.sendFailed"));
      } else {
        toast.error(t("auth.errNetwork"));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 backdrop-blur-sm sm:items-center"
      style={{ background: "rgba(10, 12, 10, 0.44)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("verify.pendingTitle")}
        className="uf-modal-in w-full max-w-[420px] rounded-[24px] p-6 text-center sm:p-7"
        style={{
          background: "var(--uf-surface)",
          boxShadow: "0 24px 60px rgba(10, 12, 10, 0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent">
          <i className="bx bx-envelope text-[22px]" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">
          {t("verify.pendingTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("verify.pendingBody", { email })}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            label={t("verify.resend")}
            variant="primary"
            size="lg"
            width="100%"
            isLoading={sending}
            isDisabled={sending}
            onClick={resend}
          />
          <button
            type="button"
            onClick={onClose}
            className="py-1 text-sm font-medium text-muted underline-offset-2 hover:underline"
          >
            {t("verify.changeEmail")}
          </button>
        </div>
      </div>
    </div>
  );
}
