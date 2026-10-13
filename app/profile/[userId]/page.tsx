import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getPerson, getProfileStats } from "@/features/profile/api";
import { PerformanceSummary } from "@/features/profile/components/PerformanceSummary";
import { ProfileDetailCard } from "@/features/profile/components/ProfileDetailCard";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) return { title: "Profile" };
  return { title: `${person.name} — Bareng`, description: person.bio };
}

/** Mirrors the two cards of the Profile page (Figma 414:822). */
function ProfileSkeleton() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="h-4 w-28 rounded bg-placeholder" />
        <div className="mt-6 flex flex-col items-center">
          <div className="size-20 rounded-full bg-placeholder" />
          <div className="mt-3 h-5 w-32 rounded bg-placeholder" />
          <div className="mt-2 h-3.5 w-24 rounded bg-placeholder" />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <div className="h-3.5 w-full rounded bg-placeholder" />
          <div className="h-3.5 w-2/3 rounded bg-placeholder" />
        </div>
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-placeholder/60" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="h-4 w-40 rounded bg-placeholder" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-bg p-4">
              <div className="h-7 w-10 rounded bg-placeholder" />
              <div className="mt-2 h-3.5 w-20 rounded bg-placeholder" />
              <div className="mt-3 h-3.5 w-16 rounded bg-placeholder" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function ProfileBody({ userId }: { userId: string }) {
  const person = await getPerson(userId);
  if (!person) notFound();
  const stats = await getProfileStats(person);
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <ProfileDetailCard person={person} />
      <PerformanceSummary personId={person.id} stats={stats} />
    </div>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) notFound();

  return (
    <AppShell
      breadcrumbRoot={person.name}
      breadcrumbLeaf="Profile"
      backLabel="Feed"
      backHref="/"
    >
      <h1 className="sr-only">{person.name}</h1>
      <div className="mx-auto w-full max-w-6xl px-6 py-6 lg:px-10">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileBody userId={userId} />
        </Suspense>
      </div>
    </AppShell>
  );
}
