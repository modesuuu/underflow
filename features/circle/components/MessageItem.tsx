"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import {
  deleteMessage,
  editMessage,
  togglePin,
  toggleReaction,
} from "../store";
import type { CircleMember, CircleMessage } from "../types";

export const REACTION_SET = ["👍", "❤️", "🎉", "👀"];

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Middle-truncate long file names: start…end (spec §10 worst cases). */
export function truncateMiddle(name: string, max = 30): string {
  if (name.length <= max) return name;
  const head = Math.ceil((max - 1) * 0.6);
  const tail = Math.floor((max - 1) * 0.4);
  return `${name.slice(0, head)}…${name.slice(name.length - tail)}`;
}

/** Render message text with @mentions of members highlighted. */
export function MessageBody({
  body,
  memberNames,
}: {
  body: string;
  memberNames: string[];
}) {
  const parts = body.split(/(\s+)/);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1).replace(/[.,!?;:]+$/, "");
          if (memberNames.includes(name)) {
            return (
              <span key={i} className="font-semibold text-accent">
                {part}
              </span>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export function ReplyQuote({
  target,
  targetAuthor,
}: {
  target: CircleMessage | undefined;
  targetAuthor: CircleMember | undefined;
}) {
  if (!target) {
    return (
      <div className="mb-1 border-l-2 border-line pl-2 text-xs text-subtle">
        Original message was deleted.
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(`circle-msg-${target.id}`)
          ?.scrollIntoView({ block: "center", behavior: "smooth" })
      }
      className="mb-1 block w-full cursor-pointer truncate border-l-2 border-line pl-2 text-left text-xs text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <span className="font-semibold">{targetAuthor?.name ?? "Unknown"}</span>{" "}
      {target.body}
    </button>
  );
}

/**
 * One message row (spec §5). Desktop gets a hover toolbar (quick react,
 * reply, pin, edit, delete, more); the "···" menu carries the same
 * actions with labels and is always reachable on touch. Delete is a
 * two-step inline confirm on the menu item itself. Edit is inline.
 */
export function MessageItem({
  projectId,
  message,
  author,
  membersById,
  messagesById,
  isContinuation,
  meIsOwner,
  onReply,
}: {
  projectId: string;
  message: CircleMessage;
  author: CircleMember | undefined;
  membersById: Map<string, CircleMember>;
  messagesById: Map<string, CircleMessage>;
  isContinuation: boolean;
  meIsOwner: boolean;
  onReply: (message: CircleMessage) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const isMine = message.authorId === "me";
  const canDelete = isMine || meIsOwner;
  const memberNames = [...membersById.values()].map((m) => m.name);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
  };

  const startDelete = () => {
    if (confirmDelete) {
      deleteMessage(projectId, message.id);
      closeMenu();
    } else {
      setConfirmDelete(true);
    }
  };

  const saveEdit = () => {
    if (draft.trim() && draft.trim() !== message.body) {
      editMessage(projectId, message.id, draft);
    }
    setEditing(false);
  };

  const toolButton =
    "flex size-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

  const menuItem =
    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

  return (
    <div
      id={`circle-msg-${message.id}`}
      className="group relative flex gap-3 px-4 py-0.5 transition-colors hover:bg-bg"
    >
      <div className="flex w-9 shrink-0 justify-center">
        {isContinuation ? (
          <span className="pt-1 text-[10px] leading-none text-subtle opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <Avatar alt={author?.name ?? "?"} size={36} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">
              {author?.name ?? "Unknown"}
            </span>
            <span className="text-xs text-subtle">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        {message.pinned && (
          <div className="flex items-center gap-1 text-xs text-subtle">
            <Icon name="pin" size={12} />
            Pinned
          </div>
        )}
        {message.replyToId && (
          <ReplyQuote
            target={messagesById.get(message.replyToId)}
            targetAuthor={
              message.replyToId
                ? membersById.get(messagesById.get(message.replyToId)?.authorId ?? "")
                : undefined
            }
          />
        )}
        {editing ? (
          <div className="flex flex-col gap-2 py-1">
            <textarea
              ref={editRef}
              value={draft}
              maxLength={2000}
              rows={Math.min(5, Math.max(1, draft.split("\n").length))}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              aria-label="Edit message"
              className="w-full resize-none rounded-xl bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="cursor-pointer rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-on-accent transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="cursor-pointer rounded-full bg-bg px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-line/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <MessageBody body={message.body} memberNames={memberNames} />
            {message.editedAt && (
              <span className="text-xs text-subtle">(edited)</span>
            )}
          </>
        )}
        {message.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1.5">
            {message.attachments.map((file) => (
              <div
                key={file.name}
                className="flex max-w-xs items-center gap-2.5 rounded-lg bg-bg px-3 py-2"
              >
                <Icon name="file" size={18} className="shrink-0 text-subtle" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium text-ink">
                    {truncateMiddle(file.name)}
                  </span>
                  <span className="text-xs text-subtle">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                aria-pressed={reaction.reactedByMe}
                aria-label={`${reaction.emoji} reaction, ${reaction.count}`}
                onClick={() => toggleReaction(projectId, message.id, reaction.emoji)}
                className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  reaction.reactedByMe
                    ? "bg-accent/15 font-medium text-ink ring-1 ring-accent"
                    : "bg-bg text-muted ring-1 ring-line hover:text-ink"
                }`}
              >
                <span aria-hidden>{reaction.emoji}</span>
                {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover toolbar (desktop) + always-reachable menu trigger */}
      {!editing && (
        <>
          <div className="absolute -top-3 right-4 z-10 hidden items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5 opacity-0 shadow-[0_8px_20px_-8px_rgba(var(--uf-shadow-rgb),0.35)] transition-opacity group-hover:opacity-100 focus-within:opacity-100 lg:flex">
            <button
              type="button"
              aria-label="React with thumbs up"
              onClick={() => toggleReaction(projectId, message.id, "👍")}
              className={toolButton}
            >
              <span aria-hidden className="text-sm">👍</span>
            </button>
            <button
              type="button"
              aria-label="Reply"
              onClick={() => onReply(message)}
              className={toolButton}
            >
              <Icon name="reply" size={15} />
            </button>
            <button
              type="button"
              aria-label={message.pinned ? "Unpin message" : "Pin message"}
              aria-pressed={message.pinned}
              onClick={() => togglePin(projectId, message.id)}
              className={toolButton}
            >
              <Icon name="pin" size={15} solid={message.pinned} />
            </button>
            {isMine && (
              <button
                type="button"
                aria-label="Edit message"
                onClick={() => {
                  setDraft(message.body);
                  setEditing(true);
                }}
                className={toolButton}
              >
                <Icon name="edit" size={15} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                aria-label="Delete message"
                onClick={() => {
                  setMenuOpen(true);
                  setConfirmDelete(true);
                }}
                className={toolButton}
              >
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
          <div className="absolute top-0.5 right-4 z-10">
            <button
              type="button"
              aria-label="Message actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-subtle transition-colors hover:bg-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Icon name="dots-horizontal-rounded" size={17} />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={closeMenu}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute top-full right-0 z-20 mt-1 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-12px_rgba(var(--uf-shadow-rgb),0.25)]"
                >
                  <div className="flex items-center gap-1 px-1.5 py-1">
                    {REACTION_SET.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`React with ${emoji}`}
                        onClick={() => {
                          toggleReaction(projectId, message.id, emoji);
                          closeMenu();
                        }}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-base transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <span aria-hidden>{emoji}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onReply(message);
                      closeMenu();
                    }}
                    className={menuItem}
                  >
                    <Icon name="reply" size={15} className="text-subtle" />
                    Reply
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      togglePin(projectId, message.id);
                      closeMenu();
                    }}
                    className={menuItem}
                  >
                    <Icon name="pin" size={15} className="text-subtle" />
                    {message.pinned ? "Unpin message" : "Pin message"}
                  </button>
                  {isMine && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setDraft(message.body);
                        setEditing(true);
                        closeMenu();
                      }}
                      className={menuItem}
                    >
                      <Icon name="edit" size={15} className="text-subtle" />
                      Edit message
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={startDelete}
                      className={`${menuItem} ${
                        confirmDelete
                          ? "bg-badge/10 font-medium text-badge hover:bg-badge/15"
                          : ""
                      }`}
                    >
                      <Icon name="trash" size={15} className={confirmDelete ? "text-badge" : "text-subtle"} />
                      {confirmDelete ? "Delete?" : "Delete message"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
