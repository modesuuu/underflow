import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy · Underflow",
  description: "What Underflow collects, why, and what you can do about it.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="November 16, 2026">
      <LegalSection heading="1. Data we collect">
        <p>
          Account data: your username, email address, and a hashed password
          (we never store your password in plain text). If you sign in with
          Google, we receive your name, email address, and profile photo
          from Google.
        </p>
        <p>
          Profile and content: your display name, bio, skills, profile
          photo, posts, project descriptions, applications, comments, and
          the messages you send inside projects and the inbox.
        </p>
        <p>
          Technical data: basic request logs our server keeps to run and
          secure the service, such as IP addresses used for rate limiting.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>
          We use your data to run the platform: showing your profile and
          projects to other students, delivering applications and messages,
          sending verification and password-reset emails, and moderating
          content under our Terms. We do not sell your data, and we do not
          use it for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="3. What other users see">
        <p>
          Your profile, posts, and projects are visible to other signed-in
          students. Project spaces and direct messages are visible only to
          their participants. Moderation staff can review reported content,
          including content inside a project when a participant reports it.
        </p>
      </LegalSection>

      <LegalSection heading="4. Service providers">
        <p>
          We rely on a small number of providers to run Underflow: an email
          service to deliver verification and reset messages, and an image
          host for photos you upload. They receive only the data needed to
          do that job.
        </p>
      </LegalSection>

      <LegalSection heading="5. Storage on your device">
        <p>
          Underflow stores your session token and your preferences (theme,
          language) in your browser&apos;s local storage so you stay signed
          in and the app remembers your settings. We do not use third-party
          tracking cookies.
        </p>
      </LegalSection>

      <LegalSection heading="6. Keeping and deleting data">
        <p>
          We keep your data while your account exists. When you delete your
          account from Settings, your identity is anonymized: your name,
          username, and email are removed and your sign-in is disabled.
          Messages and contributions inside shared projects may remain,
          attributed to a deleted user, so those projects keep their
          history. Backups and server logs age out on their own schedule.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your choices">
        <p>
          You can edit your profile and skills, control which notification
          categories you receive, and delete your account, all from
          Settings. For anything else about your data, contact us through
          the Contact page.
        </p>
      </LegalSection>

      <LegalSection heading="8. Security">
        <p>
          Passwords are hashed, sign-in attempts are rate limited, and
          sessions can be revoked when you change your password or sign out.
          No system is perfectly secure, so use a password you do not reuse
          elsewhere.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to this policy">
        <p>
          If we change this policy in a way that matters, we will note the
          new date on this page.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
