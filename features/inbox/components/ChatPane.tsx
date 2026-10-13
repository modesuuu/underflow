"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { resolveApplication, sendMessage } from "../store";
import type { Conversation } from "../types";
import { ApplicationCard } from "./ApplicationCard";

/**
 * Right side of the Inbox (Figma 386:5): no header bar — a floating
 * name chip, the message stack (incoming gray bubbles left, outgoing
 * lime bubbles right, application card riding in the applicant's
 * stack), and the composer pinned to the bottom.
 */
export function ChatPane({ conversation }: { conversation: Conversation | null }) {
  const [draft, setDraft] = useState("");
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
  // the frame); stacks sit 24px apart. The application card rides
  // right after the applicant's first stack: theirs for an incoming
  // application, mine for an outgoing one.
  const cardAfterFrom = application
    ? application.direction === "incoming"
      ? "them"
      : "me"
    : null;
  const groups: { from: "me" | "them"; messages: typeof conversation.messages }[] =
    [];
  for (const message of conversation.messages) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.from === message.from) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ from: message.from, messages: [message] });
    }
  }
  let cardInserted = false;

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(conversation.id, draft);
    setDraft("");
  };

  return (
    <section
      aria-label={`Conversation with ${conversation.name}`}
      className="flex min-w-0 flex-1 flex-col bg-surface"
    >
      <div className="flex flex-col items-center gap-1 pt-4 pb-2">
        <Avatar size={42} alt={conversation.name} />
        <span className="rounded-full bg-[#d3cfff] px-3 py-0.5 text-sm font-medium text-ink">
          {conversation.name}
        </span>
      </div>

      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-6">
          {groups.map((group, groupIndex) => {
            const mine = group.from === "me";
            const insertCard =
              application && !cardInserted && cardAfterFrom === group.from;
            if (insertCard) cardInserted = true;
            return (
              <div
                key={`${group.from}-${groupIndex}`}
                className="flex flex-col gap-6"
              >
                <div
                  className={`flex flex-col gap-1.5 ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  {group.messages.map((message) => (
                    <p
                      key={message.id}
                      className={`max-w-[310px] rounded-2xl px-3 py-3 text-[15px] whitespace-pre-wrap ${
                        mine ? "bg-accent text-ink" : "bg-bg text-ink"
                      }`}
                    >
                      {message.text}
                    </p>
                  ))}
                </div>
                {insertCard && application && (
                  <div
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <ApplicationCard
                      application={application}
                      onResolve={(status) =>
                        resolveApplication(conversation.id, status)
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSend} className="px-5 pt-2 pb-6">
        <div className="flex w-full max-w-[636px] items-center gap-2 rounded-xl border border-line bg-surface p-3">
          <label className="sr-only" htmlFor={`composer-${conversation.id}`}>
            Message {conversation.name}
          </label>
          <input
            id={`composer-${conversation.id}`}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Aa"
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            aria-label="Voice message (not available yet)"
            className="shrink-0 cursor-pointer text-muted transition-colors hover:text-ink"
          >
            <Icon name="microphone" size={22} />
          </button>
          <button
            type="button"
            aria-label="Attach a file (not available yet)"
            className="shrink-0 cursor-pointer text-muted transition-colors hover:text-ink"
          >
            <Icon name="paperclip" size={22} />
          </button>
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim()}
            className="shrink-0 cursor-pointer rounded-lg bg-accent p-2 text-ink transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      </form>
    </section>
  );
}
