import { Suspense } from "react";
import type { Metadata } from "next";
import { RedirectIfAuthed } from "@/features/auth/components/AuthGate";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password — Underflow",
  description: "Request a password reset link for your Underflow account.",
};

export default function ForgotPasswordPage() {
  return (
    <RedirectIfAuthed>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </RedirectIfAuthed>
  );
}
