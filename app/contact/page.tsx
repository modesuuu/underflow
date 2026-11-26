import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the Underflow team.",
};

export default function ContactPage() {
  return (
    <LegalShell title="Contact">
      <LegalSection heading="Email us">
        <p>
          The Underflow team reads email at{" "}
          <a
            href="mailto:underflowstaff@gmail.com"
            className="font-medium text-ink underline underline-offset-2"
          >
            underflowstaff@gmail.com
          </a>
          . We are a small student team, so replies can take a few days.
        </p>
      </LegalSection>

      <LegalSection heading="What to write about">
        <p>
          Account problems you cannot solve from Settings, questions about
          your data or the Privacy Policy, and reports about content that
          the in-app report button does not cover.
        </p>
        <p>
          For a removed post or a suspended account, the appeal button on
          the removal notice in your inbox (or on the sign-in screen) is
          faster than email, because it reaches the moderation queue
          directly with your case attached.
        </p>
      </LegalSection>

      <LegalSection heading="Before you write">
        <p>
          If you cannot sign in, try the forgot-password flow first; it
          solves most lockouts. If your verification email never arrived,
          check spam, then sign up again with the same details to get a
          fresh link.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
