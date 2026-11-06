import { Suspense } from "react";
import type { Metadata } from "next";
import { RedirectIfAuthed } from "@/features/auth/components/AuthGate";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign up — Underflow",
  description: "Create an Underflow account to find collaborators and build together.",
};

export default function SignupPage() {
  return (
    <RedirectIfAuthed>
      <Suspense>
        <SignupForm />
      </Suspense>
    </RedirectIfAuthed>
  );
}
