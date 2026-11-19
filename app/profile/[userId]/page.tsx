import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getPerson, getProfileStats } from "@/features/profile/api";
import { PerformanceSummary } from "@/features/profile/components/PerformanceSummary";
import { ProfileAboutCard } from "@/features/profile/components/ProfileAboutCard";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileLoader } from "@/features/profile/components/ProfileLoader";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) return { title: "Profile" };
  return { title: `${person.name} — Underflow`, description: person.bio };
}

/** Mirrors the built page: header row, tab bar, stats band, About card. */
function ProfileSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-center gap-6">
        <div className="size-28 shrink-0 rounded-full bg-placeholder" />
        <div className="flex flex-col gap-2.5">
          <div className="h-7 w-44 rounded bg-placeholder" />
          <div className="h-4 w-32 rounded bg-placeholder/60" />
          <div className="h-4 w-64 rounded bg-placeholder/60" />
        </div>
      </div>
      <div className="h-10 w-72 rounded-full bg-bg" />
      <div className="rounded-3xl bg-bg p-4">
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl bg-surface p-5">
              <div className="h-5 w-36 rounded bg-placeholder" />
              <div className="h-8 w-16 rounded bg-placeholder" />
              <div className="h-4 w-48 rounded bg-placeholder/60" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-bg p-5">
        <div className="h-5 w-40 rounded bg-placeholder" />
        <div className="mt-4 h-9 w-72 rounded bg-placeholder/60" />
      </div>
    </div>
  );
}

async function ProfileBody({ userId }: { userId: string }) {
  const person = await getPerson(userId);
  if (!person) notFound();
  const stats = await getProfileStats(person);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <ProfileHeader person={person} activeTab="overview" />
      <PerformanceSummary personId={person.id} stats={stats} />
      <ProfileAboutCard person={person} />
    </div>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person && userId !== "me") notFound();
  if (!person) {
    return (
      <AppShell
        hideTopBar
        breadcrumbRoot="Profile"
        breadcrumbLeaf="Profile"
        backLabel="Feed"
        backHref="/"
      >
        <h1 className="sr-only">Profile</h1>
        <div className="flex h-full flex-col px-4 py-6 sm:px-6">
          <ProfileLoader userId={userId} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      hideTopBar
      breadcrumbRoot={person.name}
      breadcrumbLeaf="Profile"
      backLabel="Feed"
      backHref="/"
    >
      <h1 className="sr-only">{person.name}</h1>
      <div className="flex h-full flex-col px-4 py-6 sm:px-6">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileBody userId={userId} />
        </Suspense>
      </div>
    </AppShell>
  );
}
