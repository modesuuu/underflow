import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  getPerson,
  getPersonProjects,
  getProfileStats,
  getUserActivity,
} from "@/features/profile/api";
import { ActivityHeatmap } from "@/features/profile/components/ActivityHeatmap";
import { ProfileDetailCard } from "@/features/profile/components/ProfileDetailCard";
import { ProfileLoader } from "@/features/profile/components/ProfileLoader";
import { ProfileRail } from "@/features/profile/components/ProfileRail";
import { ProjectsHighlight } from "@/features/profile/components/ProjectsHighlight";

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

/** Mirrors the built page: profile rail + stacked content cards. */
function ProfileSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
        <div className="aspect-square w-36 rounded-2xl bg-placeholder sm:w-44 lg:w-full" />
        <div className="h-6 w-40 rounded bg-placeholder" />
        <div className="h-4 w-28 rounded bg-placeholder/60" />
        <div className="flex flex-col gap-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-bg" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl bg-bg p-5">
            <div className="h-5 w-44 rounded bg-placeholder" />
            <div className="h-4 w-72 max-w-full rounded bg-placeholder/60" />
            <div className="h-4 w-56 max-w-full rounded bg-placeholder/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function ProfileBody({ userId }: { userId: string }) {
  const person = await getPerson(userId);
  if (!person) notFound();
  const [stats, activity, projects] = await Promise.all([
    getProfileStats(person),
    getUserActivity(person.id),
    getPersonProjects(person),
  ]);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
      <ProfileRail person={person} stats={stats} activeTab="overview" />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <ProfileDetailCard person={person} />
        {activity && <ActivityHeatmap activity={activity} />}
        <ProjectsHighlight person={person} projects={projects} />
      </div>
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
