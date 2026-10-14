"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { toast } from "sonner";
import {
  clearThread,
  deleteThread,
  resolveApplication,
  restoreThread,
  sendMessage,
} from "../store";
import type { Conversation } from "../types";
import { ApplicationCard } from "./ApplicationCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { ThreadOptionsMenu } from "./ThreadOptionsMenu";

/**
 * Right side of the Inbox (Figma 386:5), WhatsApp-Web model: the
 * pane fills the main area and only the message list scrolls. The
 * name chip (avatar + lavender capsule, soft group shadow) floats
 * at the top-center with NO bar behind it — just the photo and the
 * name stay while messages scroll underneath. The composer is a
 * full-width pill with a circular lime send button.
 */
export function ChatPane({ conversation }: { conversation: Conversation | null }) {
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState<"clear" | "delete" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation?.id, conversation?.messages.length]);

  if (!conversation) {
    return (
      <section
        aria-label="Conversation"
        className="flex min-w-0 flex-1 items-center justify-center bg-surface"
      >
        <p className="text-sm text-muted">Select a conversation</p>
      </section>
    );
  }

  const { application } = conversation;
  // Consecutive same-sender messages form one stack (6px apart in
  // the frame); stacks sit 24px apart. The application card is
  // pinned to the application MOMENT — right after the thread's
  // first message (the application message itself) — so later
  // messages flow below it and push it up, instead of the card
  // trailing the whole conversation.
  type Block =
    | { kind: "stack"; from: "me" | "them"; messages: typeof conversation.messages }
    | { kind: "card" };
  const blocks: Block[] = [];
  conversation.messages.forEach((message, index) => {
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock?.kind === "stack" && lastBlock.from === message.from) {
      lastBlock.messages.push(message);
    } else {
      blocks.push({ kind: "stack", from: message.from, messages: [message] });
    }
    if (index === 0 && application) blocks.push({ kind: "card" });
  });

  const handleResolve = (status: "accepted" | "declined") => {
    resolveApplication(conversation.id, status);
    if (!application) return;
    const description = `${conversation.name}'s application for ${application.projectTitle} was ${status}.`;
    if (status === "accepted") {
      toast.success("Application accepted", { description });
    } else {
      toast("Application declined", { description });
    }
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(conversation.id, draft);
    setDraft("");
  };

  return (
    <section
      aria-label={`Conversation with ${conversation.name}`}
      className="relative flex min-w-0 flex-1 flex-col bg-surface"
    >
      {/* Floating identity chip — photo + name only, no bar. */}
      <div className="pointer-events-none absolute top-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 [filter:drop-shadow(0_18px_20px_rgba(0,0,0,0.15))]">
        <Avatar size={42} alt={conversation.name} />
        <span className="min-w-[88px] rounded-full bg-lav px-3 py-1 text-center text-base font-medium text-on-lav">
          {conversation.name}
        </span>
      </div>

      {/* Thread actions for the open conversation — one quiet
          kebab at the pane's top-right (the design's standalone
          Clear All / Delete Chat buttons floated here as labeled
          pills; the user found them intrusive, so they live in
          this menu now, same as on the rail rows). */}
      <div className="absolute top-4 right-6 z-10">
        <ThreadOptionsMenu
          thread={conversation}
          onClearRequest={() => setConfirm("clear")}
          onDeleteRequest={() => setConfirm("delete")}
        />
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-6 pt-[104px] pb-6"
      >
        <div className="flex flex-col gap-6">
          {conversation.messages.length === 0 &&
            (application ? (
              <div
                className={`flex ${
                  application.direction === "outgoing"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <ApplicationCard
                  application={application}
                  onResolve={handleResolve}
                />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted">
                No messages in this chat yet.
              </p>
            ))}
          {blocks.map((block, blockIndex) => {
            if (block.kind === "card" && application) {
              const mine = application.direction === "outgoing";
              return (
                <div
                  key="application-card"
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <ApplicationCard
                    application={application}
                    onResolve={handleResolve}
                  />
                </div>
              );
            }
            if (block.kind !== "stack") return null;
            const mine = block.from === "me";
            return (
              <div
                key={`${block.from}-${blockIndex}`}
                className={`flex flex-col gap-1.5 ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                {block.messages.map((message) => (
                  <p
                    key={message.id}
                    className={`max-w-[310px] rounded-2xl px-3 py-3 text-base whitespace-pre-wrap ${
                      mine
                        ? "rounded-br-[2px] bg-accent text-on-accent"
                        : "rounded-bl-[2px] bg-bg text-ink"
                    }`}
                  >
                    {message.text}
                    <span
                      className={`float-right mt-2.5 ml-3 text-[10px] leading-none ${
                        mine ? "text-ink/55" : "text-subtle"
                      }`}
                    >
                      {message.clock}
                    </span>
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSend} className="shrink-0 px-6 pt-2 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-bg px-4 py-2 transition-shadow focus-within:ring-2 focus-within:ring-accent">
            <label className="sr-only" htmlFor={`composer-${conversation.id}`}>
              Message {conversation.name}
            </label>
            <input
              id={`composer-${conversation.id}`}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Aa"
              className="h-8 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            />
            <button
              type="button"
              aria-label="Voice message (not available yet)"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <Icon name="microphone" size={20} />
            </button>
            <button
              type="button"
              aria-label="Attach a file (not available yet)"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <Icon name="paperclip" size={20} />
            </button>
          </div>
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim()}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      </form>

      {confirm && (
        <ConfirmDialog
          title={confirm === "delete" ? "Delete chat" : "Clear chat"}
          description={
            confirm === "delete"
              ? `The chat with ${conversation.name} will be deleted. This cannot be undone.`
              : `Messages in this chat will be removed. The conversation and its application stay. This cannot be undone.`
          }
          confirmLabel={confirm === "delete" ? "Delete" : "Clear"}
          onConfirm={() => {
            const snapshot = conversation;
            if (confirm === "delete") {
              deleteThread(conversation.id);
              toast("Chat deleted", {
                description: snapshot.name,
                duration: 5000,
                action: {
                  label: "Undo",
                  onClick: () => restoreThread(snapshot),
                },
              });
            } else {
              clearThread(conversation.id);
              toast("Chat cleared", {
                description: snapshot.name,
                duration: 5000,
                action: {
                  label: "Undo",
                  onClick: () => restoreThread(snapshot),
                },
              });
            }
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
