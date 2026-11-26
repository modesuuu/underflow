import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "About",
  description: "What Underflow is and how it works.",
};

export default function AboutPage() {
  return (
    <LegalShell title="About Underflow">
      <LegalSection heading="Built for students who need a team">
        <p>
          Finding people to build with is harder than it should be. Group
          work usually starts in a chat group, a class announcement, or a
          friend of a friend, and plenty of good projects never find the
          people they need. Underflow gives that search a home: post the
          project, say which skills you are missing, and let the right
          students come to you.
        </p>
      </LegalSection>

      <LegalSection heading="How it works">
        <p>
          Post a collaboration, for coursework, a portfolio piece, or a
          product idea. Other students apply with a short message. If the
          owner accepts, the team gets a shared space to talk and organize
          the work. Along the way, everyone builds a public profile of real
          projects they have actually shipped with other people.
        </p>
      </LegalSection>

      <LegalSection heading="Who made this">
        <p>
          Underflow is designed and built by students, for students. It
          started as a class project and keeps growing one verified feature
          at a time.
        </p>
      </LegalSection>

      <LegalSection heading="Start now">
        <p>
          <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
            Create an account
          </Link>{" "}
          or browse the{" "}
          <Link href="/collaborations" className="font-medium text-ink underline underline-offset-2">
            collaborations
          </Link>{" "}
          students are posting right now.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
