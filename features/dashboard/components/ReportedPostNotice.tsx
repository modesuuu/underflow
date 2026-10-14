"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * The post-report confirmation that replaces a post's content —
 * one shared treatment: the feed card swaps to it, and so does
 * the post detail body. Undo restores the post (session state).
 */
export function ReportedPostNotice({ onUndo }: { onUndo: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
      <Icon name="flag" size={20} className="shrink-0 text-muted" />
      <p className="flex-1 text-sm text-muted">
        <span className="font-medium text-ink">You reported this post.</span>{" "}
        Thanks — our team will review it.
      </p>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 cursor-pointer text-sm font-medium text-ink hover:underline"
      >
        Undo
      </button>
    </div>
  );
}
