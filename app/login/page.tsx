import { Suspense } from "react";
import type { Metadata } from "next";
import { RedirectIfAuthed } from "@/features/auth/components/AuthGate";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Log in — Underflow",
  description: "Log in to Underflow to find collaborators and build together.",
};

export default function LoginPage() {
  return (
    <RedirectIfAuthed>
      <Suspense>
        <LoginForm />
      </Suspense>
    </RedirectIfAuthed>
  );
}
