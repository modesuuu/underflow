"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "@/features/admin/components/AdminShell";
import { ModerationForm } from "@/features/admin/components/ModerationForm";
import { fmtDate, getAdminContent } from "@/features/admin/api";
import type {
  AdminContentItem,
  AdminContentType,
  AdminPage,
  ModerationTarget,
} from "@/features/admin/types";
import {
  EmptyState,
  ErrorState,
  ModerationPill,
  PageHeader,
  Pagination,
  Pill,
  TABLE_WRAP,
  TD,
  TH,
} from "@/features/admin/components/ui";

/**
 * Admin Content (spec-admin.md §7): posts, comments and
 * collaborations in one place, including content already
 * removed by moderation. Read-only in Fase 1.
 */

const TABS: { id: AdminContentType; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "comments", label: "Comments" },
  { id: "collabs", label: "Collaborations" },
];

function OwnerCell({ item }: { item: AdminContentItem }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar size={24} src={item.owner_photo ?? undefined} alt={item.owner_name} />
      <span className="text-muted">{item.owner_name}</span>
    </span>
  );
}

function ReportsCell({ count }: { count: number }) {
  if (count <= 0) return <span className="text-muted">0</span>;
  return (
    <span className="font-semibold" style={{ color: "var(--color-error, #c9303a)" }}>
      {count}
    </span>
  );
}

export default function AdminContentPage() {
  const { viewer, refreshOverview } = useAdmin();
  const [tab, setTab] = useState<AdminContentType>("posts");
  const [state, setState] = useState("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPage<AdminContentItem> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [formTarget, setFormTarget] = useState<ModerationTarget | null>(null);

  const removeActionFor = (item: AdminContentItem): ModerationTarget => ({
    actionType:
      tab === "posts"
        ? "remove_post"
        : tab === "comments"
          ? "remove_comment"
          : "remove_collab",
    targetType:
      tab === "posts" ? "post" : tab === "comments" ? "comment" : "collab",
    targetId: item.id,
    targetLabel: item.title ?? item.description ?? item.content ?? item.id,
  });

  const actionCell = (item: AdminContentItem) => (
    <span className="flex items-center justify-end gap-3">
      {item.moderation_state === "visible" ? (
        <button
          type="button"
          onClick={() => setFormTarget(removeActionFor(item))}
          className="cursor-pointer text-[13px] font-medium"
          style={{ color: "var(--color-error, #c9303a)" }}
        >
          {viewer.role === "super_admin" ? "Remove" : "Propose removal"}
        </button>
      ) : viewer.role === "super_admin" ? (
        <button
          type="button"
          onClick={() =>
            setFormTarget({
              actionType: "restore_content",
              targetType:
                tab === "posts"
                  ? "post"
                  : tab === "comments"
                    ? "comment"
                    : "collab",
              targetId: item.id,
              targetLabel: item.title ?? item.description ?? item.content ?? item.id,
            })
          }
          className="cursor-pointer text-[13px] font-medium text-accent"
        >
          Restore
        </button>
      ) : null}
    </span>
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setError(false);
    getAdminContent(tab, { state, q: debouncedQ, page, limit: 20 })
      .then(setData)
      .catch(() => setError(true));
  }, [tab, state, debouncedQ, page, attempt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Everything published on the platform, including removed items."
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
            <Icon name="search" size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search content or owner"
              className="w-52 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
            className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink"
            aria-label="Moderation state"
          >
            <option value="all">All states</option>
            <option value="visible">Visible</option>
            <option value="removed">Removed</option>
          </select>
        </div>
      </PageHeader>

      <div className="mb-4 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setPage(1);
              setData(null);
            }}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm ${
              tab === t.id
                ? "bg-accent font-medium text-on-accent"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
      ) : data === null ? (
        <div className={`${TABLE_WRAP} px-4 py-10 text-center text-sm text-muted`}>
          Loading content...
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState>No content matches this filter.</EmptyState>
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  {tab === "posts" && (
                    <>
                      <th className={TH}>Post</th>
                      <th className={TH}>Owner</th>
                      <th className={TH}>Views</th>
                      <th className={TH}>Comments</th>
                    </>
                  )}
                  {tab === "comments" && (
                    <>
                      <th className={TH}>Comment</th>
                      <th className={TH}>Owner</th>
                      <th className={TH}>On post</th>
                    </>
                  )}
                  {tab === "collabs" && (
                    <>
                      <th className={TH}>Collaboration</th>
                      <th className={TH}>Owner</th>
                      <th className={TH}>Project status</th>
                      <th className={TH}>Members</th>
                    </>
                  )}
                  <th className={TH}>Reports</th>
                  <th className={TH}>State</th>
                  <th className={TH}>Created</th>
                  <th className={TH}></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-b-0 hover:bg-bg">
                    {tab === "posts" && (
                      <>
                        <td className={`${TD} max-w-[380px]`}>
                          <span className="line-clamp-2">{item.description}</span>
                        </td>
                        <td className={TD}>
                          <OwnerCell item={item} />
                        </td>
                        <td className={TD}>{item.view_count ?? 0}</td>
                        <td className={TD}>{Number(item.comment_count ?? 0)}</td>
                      </>
                    )}
                    {tab === "comments" && (
                      <>
                        <td className={`${TD} max-w-[380px]`}>
                          <span className="line-clamp-2">{item.content}</span>
                        </td>
                        <td className={TD}>
                          <OwnerCell item={item} />
                        </td>
                        <td className={TD}>
                          <Link href={`/dashboard/${item.post_id}`} className="text-muted underline">
                            Open post
                          </Link>
                        </td>
                      </>
                    )}
                    {tab === "collabs" && (
                      <>
                        <td className={`${TD} max-w-[380px]`}>
                          <span className="line-clamp-2 font-medium">{item.title}</span>
                        </td>
                        <td className={TD}>
                          <OwnerCell item={item} />
                        </td>
                        <td className={TD}>
                          <Pill tone="neutral">{item.status}</Pill>
                        </td>
                        <td className={TD}>
                          {Number(item.member_count ?? 0)}/{item.required_member ?? 0}
                        </td>
                      </>
                    )}
                    <td className={TD}>
                      <ReportsCell count={Number(item.report_count ?? 0)} />
                    </td>
                    <td className={TD}>
                      <ModerationPill state={item.moderation_state} />
                    </td>
                    <td className={`${TD} text-muted`}>{fmtDate(item.created_at)}</td>
                    <td className={TD}>
                      <span className="flex items-center justify-end gap-3">
                        {actionCell(item)}
                        {tab !== "comments" && item.moderation_state === "visible" && (
                          <Link
                            href={tab === "posts" ? `/dashboard/${item.id}` : `/collaborations/${item.id}`}
                            className="text-muted hover:text-ink"
                            aria-label="Open"
                          >
                            <Icon name="link-external" size={16} />
                          </Link>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            total={data.total}
            onPage={setPage}
          />
        </>
      )}

      <ModerationForm
        role={viewer.role}
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onDone={(message) => {
          setFormTarget(null);
          toast.success(message);
          setAttempt((n) => n + 1);
          refreshOverview();
        }}
      />
    </div>
  );
}
