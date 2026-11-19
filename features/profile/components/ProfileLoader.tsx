"use client";

import { useEffect, useState } from "react";
import {
  getPerson,
  getProfileStats,
} from "@/features/profile/api";
import type {
  PersonDetail,
  ProfileStats,
} from "@/features/profile/types";
import { PerformanceSummary } from "@/features/profile/components/PerformanceSummary";
import { ProfileAboutCard } from "@/features/profile/components/ProfileAboutCard";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";

/**
 * Client-side profile loader for routes the server cannot resolve on its
 * own — today only /profile/me, whose backend call needs the JWT that
 * lives in localStorage. Fetches after mount (token available), then
 * renders the same header + stats + About stack as the server body.
 */
export function ProfileLoader({ userId }: { userId: string }) {
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
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
        const s = await getProfileStats(p);
        if (!cancelled) {
          setPerson(p);
          setStats(s);
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
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex items-center gap-6">
          <div className="size-28 shrink-0 rounded-full bg-placeholder" />
          <div className="flex flex-col gap-2.5">
            <div className="h-7 w-44 rounded bg-placeholder" />
            <div className="h-4 w-32 rounded bg-placeholder/60" />
            <div className="h-4 w-64 rounded bg-placeholder/60" />
          </div>
        </div>
        <div className="rounded-3xl bg-bg p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-2xl bg-surface p-5">
                <div className="h-5 w-36 rounded bg-placeholder" />
                <div className="h-8 w-16 rounded bg-placeholder" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <ProfileHeader person={person} activeTab="overview" />
      <PerformanceSummary personId={person.id} stats={stats} />
      <ProfileAboutCard person={person} />
    </div>
  );
}
