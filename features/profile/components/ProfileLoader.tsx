"use client";

import { useEffect, useState } from "react";
import {
  getPerson,
  getPersonCompletedJoinedProjects,
  getPersonProjects,
  getProfileStats,
  getUserActivity,
} from "@/features/profile/api";
import type {
  PersonDetail,
  ProfileStats,
  UserActivity,
} from "@/features/profile/types";
import type { CollabProject } from "@/features/collaborations/types";
import { ActivityHeatmap } from "@/features/profile/components/ActivityHeatmap";
import { CompletedJoinedProjects } from "@/features/profile/components/CompletedJoinedProjects";
import { ProfileDetailCard } from "@/features/profile/components/ProfileDetailCard";
import { ProfileRail } from "@/features/profile/components/ProfileRail";
import { ProfileSkills } from "@/features/profile/components/ProfileSkills";
import { ProjectsHighlight } from "@/features/profile/components/ProjectsHighlight";

/**
 * Client-side profile loader for routes the server cannot resolve on its
 * own — today only /profile/me, whose backend call needs the JWT that
 * lives in localStorage. Fetches after mount (token available), then
 * renders the same header + stats + About stack as the server body.
 */
export function ProfileLoader({ userId }: { userId: string }) {
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [projects, setProjects] = useState<CollabProject[]>([]);
  const [completedJoined, setCompletedJoined] = useState<CollabProject[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getPerson(userId);
        if (!p) {
          if (!cancelled) setFailed(true);
          return;
        }
        const [s, a, pr, cj] = await Promise.all([
          getProfileStats(p),
          getUserActivity(p.id),
          getPersonProjects(p),
          getPersonCompletedJoinedProjects(p),
        ]);
        if (!cancelled) {
          setPerson(p);
          setStats(s);
          setActivity(a);
          setProjects(pr);
          setCompletedJoined(cj);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-start justify-center gap-2 px-4 py-6 sm:px-6">
        <p className="text-base font-semibold text-ink">
          Something went wrong
        </p>
        <p className="text-sm text-muted">
          We couldn&apos;t load this profile. Try again later.
        </p>
      </div>
    );
  }

  if (!person || !stats) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:flex-row lg:overflow-visible">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
          <div className="aspect-square w-36 rounded-2xl bg-placeholder sm:w-40" />
          <div className="h-6 w-40 rounded bg-placeholder" />
          <div className="h-4 w-28 rounded bg-placeholder/60" />
        </div>
        <div className="no-scrollbar flex min-w-0 flex-1 flex-col gap-6 lg:min-h-0 lg:overflow-y-auto">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl bg-bg p-5">
              <div className="h-5 w-44 rounded bg-placeholder" />
              <div className="h-4 w-72 max-w-full rounded bg-placeholder/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:flex-row lg:overflow-visible">
      <ProfileRail person={person} stats={stats} activeTab="overview" />
      <div className="no-scrollbar flex min-w-0 flex-1 flex-col gap-6 lg:min-h-0 lg:overflow-y-auto">
        <ProfileDetailCard person={person} />
        <ProfileSkills person={person} />
        {activity && <ActivityHeatmap activity={activity} />}
        <ProjectsHighlight person={person} projects={projects} />
        <CompletedJoinedProjects projects={completedJoined} />
      </div>
    </div>
  );
}
