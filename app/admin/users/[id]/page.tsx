"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { fmtDate, fmtDateTime, getAdminUser } from "@/features/admin/api";
import type { AdminUserDetail } from "@/features/admin/types";
import {
  AccountPill,
  ModerationPill,
  PageHeader,
  Pill,
  RoleLabel,
} from "@/features/admin/components/ui";

/**
 * Admin user detail (spec-admin.md §7): profile, skills, their
 * posts and collaborations, strike count, moderation history.
 * Read-only in Fase 1.
 */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-[13px] text-muted">{label}</p>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<"load" | "missing" | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setError(null);
    getAdminUser(id)
      .then(setData)
      .catch((err) => {
        setError(err?.status === 404 ? "missing" : "load");
      });
  }, [id, attempt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <Icon name="arrow-back" size={16} />
        Users
      </Link>

      {error === "missing" ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center text-sm text-muted">
          This user does not exist.
        </div>
      ) : error === "load" ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-10 text-center">
          <p className="text-sm text-muted">Couldn&apos;t load this user.</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-3 cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent"
          >
            Retry
          </button>
        </div>
      ) : data === null ? (
        <p className="text-sm text-muted">Loading user...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-4">
            <Avatar
              size={56}
              src={data.user.photo_profile_url ?? undefined}
              alt={data.user.username}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight">
                  {data.user.full_name || data.user.username}
                </h1>
                <AccountPill status={data.user.account_status} />
                <RoleLabel role={data.user.role} />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                @{data.user.username} · {data.user.email} ·{" "}
                {data.user.provider === "google" ? "Google sign-in" : "Password sign-in"} ·
                joined {fmtDate(data.user.created_at)}
              </p>
              {data.user.bio && (
                <p className="mt-2 max-w-2xl text-sm whitespace-pre-wrap">
                  {data.user.bio}
                </p>
              )}
              {data.user.account_status === "suspended" && (
                <p
                  className="mt-2 max-w-2xl rounded-lg px-3 py-2 text-sm"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-error, #c9303a) 10%, transparent)",
                  }}
                >
                  Suspended {fmtDateTime(data.user.suspended_at)}
                  {data.user.suspended_reason
                    ? ` · ${data.user.suspended_reason}`
                    : ""}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Posts" value={data.user.post_count} />
            <Stat label="Collaborations" value={data.user.collab_count} />
            <Stat label="Strikes" value={data.user.strike_count} />
            <Stat label="Open reports against" value={data.reports_open_against} />
          </div>

          <Section title="Skills">
            {data.skills.length === 0 ? (
              <p className="text-sm text-muted">No skills on this profile.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-[13px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recent posts">
            {data.posts.length === 0 ? (
              <p className="text-sm text-muted">No posts yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                {data.posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 truncate">{p.description}</span>
                    <ModerationPill state={p.moderation_state} />
                    <span className="shrink-0 text-[13px] text-subtle">
                      {fmtDate(p.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Collaborations">
            {data.collabs.length === 0 ? (
              <p className="text-sm text-muted">No collaborations yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                {data.collabs.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {c.title}
                    </span>
                    <Pill tone="neutral">
                      {c.relation === "owner" ? "Owner" : "Member"}
                    </Pill>
                    <Pill tone="neutral">{c.status}</Pill>
                    <ModerationPill state={c.moderation_state} />
                    <span className="shrink-0 text-[13px] text-subtle">
                      {fmtDate(c.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Moderation history">
            {data.moderation_history.length === 0 ? (
              <p className="text-sm text-muted">
                No moderation actions against this user.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                {data.moderation_history.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {a.action_type} by {a.actor_name}
                      {a.reason ? ` · ${a.reason}` : ""}
                    </span>
                    {Number(a.strike) === 1 && <Pill tone="danger">Strike</Pill>}
                    <span className="shrink-0 text-[13px] text-subtle">
                      {fmtDateTime(a.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <p className="mt-8 text-[13px] text-subtle">
            Public profile:{" "}
            <Link href={`/profile/${data.user.id}`} className="underline">
              /profile/{data.user.username}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
