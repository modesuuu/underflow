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
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type ApplyState = "default" | "pending" | "entered" | "declined" | "closed";



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
  const { t } = useLanguage();
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
        toast(t("collab.alreadySentTitle"), {
          description: t("collab.alreadySentBody", { title: projectTitle }),
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
      toast.success(t("collab.sentTitle"), {
        description: t("collab.sentBody", { name: ownerName }),
      });
      router.push("/inbox");
    } catch (err) {
      toast.error(t("collab.failedTitle"), {
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
      toast(t("collab.withdrawnToast"), { description: projectTitle });
    } catch (err) {
      toast.error(t("collab.couldntWithdraw"), {
        description: backendErrorMessage(err),
      });
    }
  };

  return (
    <Card variant="muted" padding={6} className="flex flex-col items-center gap-3">
      {isOwner && (
        <Button
          label={t("collab.yourProject")}
          variant="secondary"
          size="lg"
          width="100%"
          isDisabled
          tooltip={t("collab.yourProject")}
        />
      )}
      {!isOwner && state === "default" &&
        (slotsFull ? (
          <Button
            label={t("collab.applyToProjectBtn")}
            variant="secondary"
            size="lg"
            width="100%"
            isDisabled
          />
        ) : (
          <Button
            label={t("collab.applyToProjectBtn")}
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
              label={t("collab.pending")}
              variant="secondary"
              size="lg"
              width="100%"
              isDisabled
            />
          </div>
          <div className="flex-1">
            <Button
              label={t("collab.cancelApplication")}
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
          label={t("collab.enteredLong")}
          variant="primary"
          size="lg"
          width="100%"
          isDisabled
        />
      )}

      {state === "declined" && (
        <Button
          label={t("collab.declinedLong")}
          variant="secondary"
          size="lg"
          width="100%"
          isDisabled
        />
      )}

      {state === "closed" && (
        <Button
          label={t("collab.closedLong")}
          variant="secondary"
          size="lg"
          width="100%"
          isDisabled
        />
      )}

      {/* Helper text below the button, per Figma "Collaborations - Details" */}
      <p className="text-xs text-muted">{t("collab.helperText")}</p>

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
