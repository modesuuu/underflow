"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/components/layout/nav";

/**
 * The feed composer, live: collapsed it is one quiet bar; opened,
 * it becomes a small editor. Posting is session-local today (the
 * feed keeps the new post on top, the toast confirms) —
 * TODO(backend): POST /api/posts, then reconcile with the server
 * list instead of prepending locally.
 */
export function Composer({
  onPost,
}: {
  onPost: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) areaRef.current?.focus();
  }, [open ]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onPost(value);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <Avatar size={36} alt={CURRENT_USER.name} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 cursor-text items-center rounded-full bg-bg px-4 py-2.5 text-left text-sm text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Share a project update…
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-ink/30 bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar size={36} alt={CURRENT_USER.name} />
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            if (e.key === "Escape") setOpen(false);
          }}
          rows={3}
          placeholder="Share a project update…"
          aria-label="Write your update"
          className="flex-1 resize-none bg-transparent pt-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-default disabled:opacity-40"
        >
          Post update
        </button>
      </div>
    </section>
  );
}
