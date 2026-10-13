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

/**
 * Mirrors the built page (Figma 414:822): two flat gray cards of equal
 * height, spread apart across the content area.
 */
function ProfileSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:justify-between">
      <div className="w-full shrink-0 rounded-3xl bg-bg p-6 lg:w-[397px]">
        <div className="h-5 w-28 rounded bg-placeholder" />
        <div className="mt-6 flex flex-col items-center">
          <div className="size-[100px] rounded-full bg-placeholder" />
          <div className="mt-3 h-7 w-32 rounded bg-placeholder" />
          <div className="mt-3 h-3.5 w-48 rounded bg-placeholder" />
        </div>
        <div className="mt-6 flex justify-center gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="size-11 rounded-full bg-placeholder/60" />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-placeholder/60" />
          ))}
        </div>
      </div>
      <div className="w-full shrink-0 rounded-3xl bg-bg p-6 lg:w-[397px]">
        <div className="h-5 w-44 rounded bg-placeholder" />
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-xl border border-line p-3">
                <div className="size-6 rounded bg-placeholder" />
                <div className="mt-3 h-6 w-10 rounded bg-placeholder" />
                <div className="mt-0.5 h-4 w-24 rounded bg-placeholder" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="size-6 rounded bg-placeholder" />
            <div className="mt-3 h-6 w-10 rounded bg-placeholder" />
            <div className="mt-0.5 h-4 w-24 rounded bg-placeholder" />
          </div>
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
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:justify-between">
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
      navVariant="none"
      hideTopBar
      breadcrumbRoot={person.name}
      breadcrumbLeaf="Profile"
      backLabel="Feed"
      backHref="/"
    >
      <h1 className="sr-only">{person.name}</h1>
      <div className="flex h-full flex-col px-6 py-6">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileBody userId={userId} />
        </Suspense>
      </div>
    </AppShell>
  );
}
