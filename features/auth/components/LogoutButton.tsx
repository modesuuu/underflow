"use client";

import { useState } from "react";
import { logout } from "../api";
import { ConfirmDialog } from "@/features/inbox/components/ConfirmDialog";

/**
 * Signs out — but only after confirming: an accidental tap used to
 * sign you straight out with no way back. The navigation is left
 * to the RequireAuth gate, which redirects to
 * /login?next=<current page> — the button doing its own replace
 * raced with the gate and the `next` param came out
 * non-deterministic. Rendered on your own profile only.
 */
export function LogoutButton() {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-bg"
      >
        Log out
      </button>
      {confirming && (
        <ConfirmDialog
          title="Log out?"
          description="You'll need to log in again to continue."
          confirmLabel="Log out"
          onConfirm={() => logout()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
