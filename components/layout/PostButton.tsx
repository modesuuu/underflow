"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * The "+ Post Something" header button. Feeds passes it explicitly to
 * AppShell's `actions` slot — it is NOT a TopBar default anymore.
 */
export function PostButton() {
  return (
    // TODO(backend): open composer modal / POST /api/posts
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1 rounded-md bg-accent p-2 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <Icon name="plus" size={16} />
      <span className="text-sm font-medium">Post Something</span>
    </button>
  );
}
