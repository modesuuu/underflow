"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { applyToCollab } from "../api";

type ApplyState = "default" | "pending" | "entered" | "declined" | "closed";

const HELPER_TEXT =
  "After applying, the owner will review your application. Track the status in My Collaboration.";

interface ApplyCtaProps {
  projectId: string;
  /** True when slotsFilled >= slotsTotal: grey + disabled button, no interaction. */
  slotsFull?: boolean;
  /** Force a terminal state from server data once the backend exists. */
  initialState?: ApplyState;
}

export function ApplyCta({
  projectId,
  slotsFull = false,
  initialState = "default",
}: ApplyCtaProps) {
  const [state, setState] = useState<ApplyState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    setSubmitting(true);
    // TODO(backend): POST /api/collaborations/:id/apply — response should set the real status
    await applyToCollab(projectId);
    setSubmitting(false);
    setState("pending");
  };

  const handleCancel = () => {
    // TODO(backend): DELETE /api/collaborations/:id/apply
    setState("default");
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-bg p-6">
      {state === "default" &&
        (slotsFull ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full bg-placeholder py-3 text-base font-medium text-muted"
          >
            Apply to this project
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-accent py-3 text-base font-medium text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-50"
          >
            <Icon name="send" size={20} />
            Apply to this project
          </button>
        ))}

      {state === "pending" && (
        <div className="flex gap-2">
          <div className="flex flex-1 items-center justify-center rounded-full border border-line py-3 text-base font-medium text-muted">
            Pending
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 cursor-pointer rounded-full bg-badge py-3 text-base font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Cancel Application
          </button>
        </div>
      )}

      {state === "entered" && (
        <div className="rounded-full bg-accent py-3 text-center text-base font-medium text-ink">
          You have entered this project
        </div>
      )}

      {state === "declined" && (
        <div className="rounded-full bg-placeholder py-3 text-center text-base font-medium text-muted">
          Your application was declined by the owner
        </div>
      )}

      {state === "closed" && (
        <div className="rounded-full bg-bg py-3 text-center text-base font-medium text-muted">
          This project is closed
        </div>
      )}

      {/* Helper text below the button, per Figma "Collaborations - Details" */}
      <p className="text-xs text-muted">{HELPER_TEXT}</p>
    </div>
  );
}
