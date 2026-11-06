"use client";

import { logout } from "../api";

/**
 * Signs out. The navigation is left to the RequireAuth gate, which
 * redirects to /login?next=<current page> — the button doing its own
 * replace raced with the gate and the `next` param came out
 * non-deterministic. Rendered on your own profile only.
 */
export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => logout()}
      className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-bg"
    >
      Log out
    </button>
  );
}
