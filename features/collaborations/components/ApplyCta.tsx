"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { applyToCollab } from "../api";

type ApplyState = "default" | "pending" | "entered" | "declined" | "closed";

const HELPER_TEXT =
  "After applying, the owner will review your application. Track the status in My Collaboration.";

interface ApplyCtaProps {
  projectId: string;
  /** True when slotsFilled >= slotsTotal: disabled control, no interaction. */
  slotsFull?: boolean;
  /** Force a terminal state from server data once the backend exists. */
  initialState?: ApplyState;
}

/* The closing line of the detail page: the one solid graphite control, plus
   the helper line that says what happens next. */
export function ApplyCta({
  projectId,
  slotsFull = false,
  initialState = "default",
}: ApplyCtaProps) {
  const [state, setState] = useState<ApplyState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    setSubmitting(true);
    // TODO(backend): POST /api/collaborations/:id/apply — response sets the real status
    await applyToCollab(projectId);
    setSubmitting(false);
    setState("pending");
  };

  const handleCancel = () => {
    // TODO(backend): DELETE /api/collaborations/:id/apply
    setState("default");
  };

  return (
    <div className="sheet flex flex-col items-center gap-3 p-6">
      {state === "default" &&
        (slotsFull ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-sm border border-rule py-3 text-sm font-semibold text-subtle"
          >
            Apply to this project
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={submitting}
            className="pressable flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-ink py-3 text-sm font-semibold text-surface disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="send" size={18} />
            Apply to this project
          </button>
        ))}

      {state === "pending" && (
        <div className="flex w-full gap-2">
          <div className="flex flex-1 items-center justify-center rounded-sm border border-rule py-3 text-sm font-medium text-muted">
            Pending
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="pressable flex-1 cursor-pointer rounded-sm bg-margin py-3 text-sm font-semibold text-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Cancel Application
          </button>
        </div>
      )}

      {state === "entered" && (
        <div className="w-full rounded-sm bg-ink py-3 text-center text-sm font-semibold text-surface">
          You have entered this project
        </div>
      )}

      {state === "declined" && (
        <div className="w-full rounded-sm border border-rule py-3 text-center text-sm font-medium text-muted">
          Your application was declined by the owner
        </div>
      )}

      {state === "closed" && (
        <div className="w-full rounded-sm bg-bg py-3 text-center text-sm font-medium text-muted">
          This project is closed
        </div>
      )}

      <p className="text-xs text-muted">{HELPER_TEXT}</p>
    </div>
  );
}