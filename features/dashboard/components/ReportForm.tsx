"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * The reason step of reporting a post (spec-admin.md §4.3):
 * replaces the post's content in place, same footprint as the
 * reported notice it leads to. The report only leaves the
 * device when this form is submitted — the parent owns the API
 * call and swaps to ReportedPostNotice on success.
 */
export function ReportForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = reason.trim().length >= 3 && !sending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
    } catch {
      setError("Couldn't send your report. Try again.");
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon name="flag" size={20} className="shrink-0 text-muted" />
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">Report this post.</span>{" "}
          Tell the team what is wrong with it.
        </p>
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason, e.g. spam, harassment, not a real project"
        rows={3}
        autoFocus
        className="w-full resize-none rounded-lg bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-subtle"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="cursor-pointer px-3 py-1.5 text-sm font-medium text-muted hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent disabled:opacity-50"
        >
          {sending ? "Sending..." : "Submit report"}
        </button>
      </div>
    </div>
  );
}
