"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startApplicationThread, withdrawApplication } from "@/features/inbox/store";
import { applyToCollab, backendErrorMessage } from "../api";
import { ApplyMessageModal } from "./ApplyMessageModal";

type ApplyState = "default" | "pending" | "entered" | "declined" | "closed";

const HELPER_TEXT =
  "The owner reviews your application after you apply. Track the status in My Collaborations.";

interface ApplyCtaProps {
  projectId: string;
  projectTitle: string;
  /** Cleaned need line for the thread's application card, e.g. "Need Frontend". */
  projectMeta: string;
  dueLabel: string;
  /** Filled/total slots label, e.g. "3 / 5". */
  slotsLabel: string;
  ownerName: string;
  ownerPersonId: string | null;
  /** True when slotsFilled >= slotsTotal: grey + disabled button, no interaction. */
  slotsFull?: boolean;
  /** True when the session user owns this project: no Apply, grey "This is your project" instead. */
  isOwner?: boolean;
  /** Force a terminal state from server data once the backend exists. */
  initialState?: ApplyState;
}

export function ApplyCta({
  projectId,
  projectTitle,
  projectMeta,
  dueLabel,
  slotsLabel,
  ownerName,
  ownerPersonId,
  slotsFull = false,
  isOwner = false,
  initialState = "default",
}: ApplyCtaProps) {
  const router = useRouter();
  const [state, setState] = useState<ApplyState>(initialState);
  // The detail page fills initialState in after its authed fetch
  // (the server render has no token); follow it when it arrives.
  useEffect(() => {
    setState(initialState);
  }, [initialState]);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleApply = async (message: string) => {
    setSubmitting(true);
    try {
      const result = await applyToCollab(projectId, message);
      if (result.alreadyApplied) {
        // 409 Already applied: the application already exists, so
        // show Pending instead of erroring (no second inbox thread).
        setState("pending");
        setModalOpen(false);
        toast("Application already sent", {
          description: `Your application to ${projectTitle} is pending review.`,
        });
        return;
      }
      // Applying = messaging the owner: open the Inbox thread with the
      // applicant's message and the outgoing application card, then go
      // straight to it so the sender sees where the message landed.
      startApplicationThread({
        ownerPersonId,
        ownerName,
        projectId,
        projectTitle,
        projectMeta,
        dueLabel,
        slotsLabel,
        messageText: message.trim(),
      });
      setState("pending");
      setModalOpen(false);
      toast.success("Application sent", {
        description: `Your message is in ${ownerName}'s inbox.`,
      });
      router.push("/inbox");
    } catch (err) {
      toast.error("Application failed", {
        description: backendErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // TODO(backend): DELETE /api/collaborations/:id/apply
    withdrawApplication(projectId);
    setState("default");
    toast("Application withdrawn", { description: projectTitle });
  };

  return (
    <div className="flex flex-col gap-3 items-center rounded-2xl bg-bg p-6">
      {isOwner && (
        <button
          type="button"
          disabled
          title="This is your project"
          className="w-full cursor-not-allowed rounded-full bg-placeholder py-3 text-base font-medium text-muted"
        >
          This is your project
        </button>
      )}
      {!isOwner && state === "default" &&
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
            onClick={() => setModalOpen(true)}
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-accent py-3 text-base font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-50"
          >
            <Icon name="send" size={20} />
            Apply to this project
          </button>
        ))}

      {state === "pending" && (
        <div className="flex gap-2 w-full">
          <div className="flex flex-1 items-center justify-center w-full rounded-md border border-line py-3 text-base font-medium text-muted">
            Pending
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 cursor-pointer rounded-md bg-badge py-3 text-base font-medium text-surface transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Cancel Application
          </button>
        </div>
      )}

      {state === "entered" && (
        <div className="rounded-full bg-accent py-3 text-center text-base font-medium text-on-accent">
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

      {modalOpen && (
        <ApplyMessageModal
          projectTitle={projectTitle}
          ownerName={ownerName}
          roleLabel={projectMeta.replace(/^Need\s+/i, "")}
          sending={submitting}
          onClose={() => setModalOpen(false)}
          onSend={handleApply}
        />
      )}
    </div>
  );
}
