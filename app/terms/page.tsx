import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Underflow.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="November 16, 2026">
      <LegalSection heading="1. What Underflow is">
        <p>
          Underflow is a collaboration platform for students. You can post
          projects, apply to join other students&apos; projects, and work
          together in a shared space once a project owner accepts you. By
          creating an account or using Underflow, you agree to these terms.
        </p>
      </LegalSection>

      <LegalSection heading="2. Your account">
        <p>
          You are responsible for your account and for keeping your password
          to yourself. Give accurate information when you sign up, and use
          one account per person. Your account becomes active only after you
          verify the email address you registered with. You must be a student
          or use the platform for genuine study and portfolio purposes.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your content">
        <p>
          Posts, project descriptions, messages and files you upload stay
          yours. By posting them on Underflow you give us permission to store
          and display them to the audience you chose (the public feed, or the
          members of your project). You are responsible for what you post:
          do not upload content you have no right to share.
        </p>
      </LegalSection>

      <LegalSection heading="4. Collaborations">
        <p>
          Project owners decide who joins their project. Accepting an
          application is not an employment relationship, an internship, or a
          promise of payment, credit, or grades. Underflow does not process
          payments between members. How a team splits its work is up to the
          team.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>
          Do not harass other users, post spam, impersonate someone else,
          share illegal content, or try to break, overload, or gain
          unauthorized access to the platform. Do not use Underflow to
          collect other users&apos; personal data.
        </p>
      </LegalSection>

      <LegalSection heading="6. Moderation and appeals">
        <p>
          We may remove content, warn accounts, or suspend accounts that
          break these terms. Warnings count as strikes on the account. If
          your content is removed or your account is suspended, you will be
          told the reason, and you can appeal from the notice in your inbox
          or from the sign-in screen. If an appeal is granted, the action and
          its strike are undone.
        </p>
      </LegalSection>

      <LegalSection heading="7. Availability">
        <p>
          Underflow is built and run by a small student team. The service is
          provided as is: it may change, break, or be unavailable, and we may
          add or remove features. We are not liable for lost work, so keep
          your own copies of anything important.
        </p>
      </LegalSection>

      <LegalSection heading="8. Ending your use">
        <p>
          You can delete your account at any time from Settings. Deleting
          anonymizes your account; content you shared inside projects may
          remain visible to those projects without your name attached, as
          described in the Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these terms">
        <p>
          If we change these terms in a way that matters, we will note the
          new date on this page. Continuing to use Underflow after a change
          means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="10. Contact">
        <p>
          Questions about these terms go to the Contact page. The fastest
          route for account problems is the appeal flow described above.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
