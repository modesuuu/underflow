import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify your email — Underflow",
  description: "Confirm your email address for your Underflow account.",
};

// No RedirectIfAuthed here on purpose, same as /reset-password: a
// verification link must work even when opened in a browser where a
// session is still live.
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
