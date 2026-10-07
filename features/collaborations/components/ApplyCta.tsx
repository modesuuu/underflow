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
    <div className="flex flex-col gap-3 rounded-lg bg-bg p-3">
      <p className="text-xs text-muted">{HELPER_TEXT}</p>

      {state === "default" &&
        (slotsFull ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md bg-placeholder py-2.5 text-base font-medium text-muted"
          >
            Apply to this project
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-base font-medium text-ink transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            <Icon name="send" size={20} />
            Apply to this project
          </button>
        ))}

      {state === "pending" && (
        <div className="flex gap-2">
          <div className="flex flex-1 items-center justify-center rounded-md border border-line py-2.5 text-base font-medium text-muted">
            Pending
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 cursor-pointer rounded-md bg-badge py-2.5 text-base font-medium text-surface transition-opacity hover:opacity-85"
          >
            Cancel Application
          </button>
        </div>
      )}

      {state === "entered" && (
        <div className="rounded-md bg-accent py-2.5 text-center text-base font-medium text-ink">
          You have entered this project
        </div>
      )}

      {state === "declined" && (
        <div className="rounded-md bg-placeholder py-2.5 text-center text-base font-medium text-muted">
          Your application was declined by the owner
        </div>
      )}

      {state === "closed" && (
        <div className="rounded-md bg-bg py-2.5 text-center text-base font-medium text-muted">
          This project is closed
        </div>
      )}
    </div>
  );
}