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
import { ProfileDetailCard } from "@/features/profile/components/ProfileDetailCard";
import { PerformanceSummary } from "@/features/profile/components/PerformanceSummary";

/**
 * Client-side profile loader for routes the server cannot resolve on its
 * own — today only /profile/me, whose backend call needs the JWT that
 * lives in localStorage. Fetches after mount (token available), then
 * renders the same two cards as the server ProfileBody.
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
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:justify-between">
        <div className="w-full shrink-0 rounded-3xl bg-bg p-6 lg:w-[397px]">
          <div className="h-5 w-28 rounded bg-placeholder" />
          <div className="mt-6 flex flex-col items-center">
            <div className="size-[100px] rounded-full bg-placeholder" />
            <div className="mt-3 h-7 w-32 rounded bg-placeholder" />
            <div className="mt-3 h-3.5 w-48 rounded bg-placeholder" />
          </div>
        </div>
        <div className="w-full shrink-0 rounded-3xl bg-bg p-6 lg:w-[397px]">
          <div className="h-5 w-44 rounded bg-placeholder" />
          <div className="mt-5 flex flex-col gap-3">
            <div className="rounded-xl border border-line p-3">
              <div className="size-6 rounded bg-placeholder" />
              <div className="mt-3 h-6 w-10 rounded bg-placeholder" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:justify-between">
      <ProfileDetailCard person={person} />
      <PerformanceSummary personId={person.id} stats={stats} />
    </div>
  );
}
