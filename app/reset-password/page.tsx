import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password — Underflow",
  description: "Set a new password for your Underflow account.",
};

// No RedirectIfAuthed here on purpose: a reset link must work even
// when opened in a browser where another account is signed in; the
// reset itself revokes all older sessions server-side.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
