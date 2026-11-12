"use client";

import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
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

/**
 * The detail page's apply panel (Astryx rebuild 2026-11-13):
 * the container is an Astryx muted Card and every state renders
 * as an Astryx Button — primary for Apply, secondary + disabled
 * for the informational states, destructive for Cancel
 * Application. The state machine and flows are unchanged.
 */
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
      await startApplicationThread({
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

  const handleCancel = async () => {
    try {
      await withdrawApplication(projectId);
      setState("default");
      toast("Application withdrawn", { description: projectTitle });
    } catch (err) {
      toast.error("Couldn't withdraw the application", {
        description: backendErrorMessage(err),
      });
    }
  };

  return (
    <Card variant="muted" padding={6} className="flex flex-col items-center gap-3">
      {isOwner && (
        <Button
          label="This is your project"
          variant="secondary"
          size="lg"
          width="100%"
          isDisabled
          tooltip="This is your project"
        />
      )}
      {!isOwner && state === "default" &&
        (slotsFull ? (
          <Button
            label="Apply to this project"
            variant="secondary"
            size="lg"
            width="100%"
            isDisabled
          />
        ) : (
          <Button
            label="Apply to this project"
            variant="primary"
            size="lg"
            width="100%"
            icon={<Icon name="send" size={20} />}
            isDisabled={submitting}
            onClick={() => setModalOpen(true)}
          />
        ))}

      {state === "pending" && (
        <div className="flex w-full gap-2">
          <div className="flex-1">
            <Button
              label="Pending"
              variant="secondary"
              size="lg"
              width="100%"
              isDisabled
            />
          </div>
          <div className="flex-1">
            <Button
              label="Cancel Application"
              variant="destructive"
              size="lg"
              width="100%"
              onClick={handleCancel}
            />
          </div>
        </div>
      )}

      {state === "entered" && (
        <Button
          label="You have entered this project"
          variant="primary"
          size="lg"
          width="100%"
          isDisabled
        />
      )}

      {state === "declined" && (
        <Button
          label="Your application was declined by the owner"
          variant="secondary"
          size="lg"
          width="100%"
          isDisabled
        />
      )}

      {state === "closed" && (
        <Button
          label="This project is closed"
          variant="secondary"
          size="lg"
          width="100%"
          isDisabled
        />
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
    </Card>
  );
}
