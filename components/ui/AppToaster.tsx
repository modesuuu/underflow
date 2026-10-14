"use client";

import { Toaster } from "sonner";

/**
 * The app's one toast surface (Sonner), mounted in the root
 * layout so toasts survive client-side navigation — e.g. an
 * application sent from a collab detail confirms as the Inbox
 * lands. Styled to the app's tokens: surface card, line border,
 * 16px radius, soft deep shadow; brand discs as state icons
 * (lime = success, red = error, ink = info). Action buttons
 * (Undo) are styled in globals.css.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      offset={24}
      gap={8}
      toastOptions={{
        duration: 3600,
        style: {
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          color: "var(--color-ink)",
          borderRadius: "16px",
          boxShadow: "0 16px 40px rgba(var(--uf-shadow-rgb), 0.14)",
          padding: "14px 16px",
        },
      }}
      icons={{
        success: (
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="10" fill="var(--uf-accent)" />
            <path
              d="M6 10.5 8.8 13 14 7.5"
              stroke="var(--uf-on-accent)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        error: (
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="10" fill="var(--uf-badge)" />
            <path
              d="M10 5.5v5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="10" cy="14" r="1.2" fill="#ffffff" />
          </svg>
        ),
        info: (
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="10" fill="var(--uf-on-accent)" />
            <path
              d="M10 9.5v5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="10" cy="6" r="1.2" fill="#ffffff" />
          </svg>
        ),
      }}
    />
  );
}
