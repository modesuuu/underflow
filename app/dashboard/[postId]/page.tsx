import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { CommentSection } from "@/features/dashboard/components/CommentSection";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { PostDetailBody } from "@/features/dashboard/components/PostDetailBody";

interface DetailPageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ focus?: string }>;
}

// P1-B #14: every post previously fell back to the root tab title. Derive
// per-post metadata (same pattern as app/collaborations/[projectId]).
export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { postId } = await params;
  const posts = await getDashboardPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return { title: "Post" };
  const excerpt = post.text.length > 60 ? `${post.text.slice(0, 60)}…` : post.text;
  return {
    title: `${post.author.name} — Bareng`,
    description: excerpt,
  };
}

/**
 * The page renders its shell synchronously and only suspends on the
 * data-bound sections (post body + notifications panel), so navigation shows
 * this page's own shape. Fallbacks are the section bodies of
 * app/dashboard/[postId]/loading.tsx, minus the AppShell.
 */
function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg bg-bg p-4">
          <div className="h-3.5 w-3/4 rounded bg-placeholder" />
          <div className="h-3 w-1/2 rounded bg-placeholder" />
        </div>
      ))}
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="ml-[28px] flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
      {/* Post body — flat, mirroring PostDetailBody's rhythm */}
      <div className="flex flex-col gap-4">
        {/* Author row */}
        <div className="flex items-center gap-2.5">
          <div className="size-9 shrink-0 rounded-full bg-placeholder" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 rounded bg-placeholder" />
            <div className="h-3 w-16 rounded bg-placeholder" />
          </div>
        </div>
        {/* Body */}
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-full rounded bg-placeholder" />
          <div className="h-3.5 w-5/6 rounded bg-placeholder" />
          <div className="h-3.5 w-2/3 rounded bg-placeholder" />
        </div>
        {/* Photo area — single big block like the real PhotoViewer/PhotoGrid,
            not a small 2x2 grid */}
        <div className="h-[306px] rounded-md bg-placeholder/60" />
        {/* Action counters */}
        <div className="flex items-center gap-4">
          <div className="h-5 w-14 rounded bg-placeholder" />
          <div className="h-5 w-14 rounded bg-placeholder" />
          <div className="h-5 w-20 rounded bg-placeholder" />
        </div>
      </div>

      <div className="h-px w-full bg-placeholder" />

      {/* Comment section */}
      <div className="flex flex-col gap-6">
        {/* Input bar — the feed-pill shape */}
        <div className="flex items-center gap-2.5">
          <div className="size-7 shrink-0 rounded-full bg-placeholder" />
          <div className="h-10 flex-1 rounded-full bg-placeholder/60" />
        </div>
        {/* Comment rows */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="size-8 shrink-0 rounded-full bg-placeholder" />
              <div className="h-3 w-32 rounded bg-placeholder" />
            </div>
            <div className="flex flex-col gap-2 pl-10">
              <div className="h-3 w-full rounded bg-placeholder" />
              <div className="h-3 w-2/3 rounded bg-placeholder" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function NotificationsPanelAsync() {
  const notifications = await getNotifications();
  return <NotificationsPanel notifications={notifications} />;
}

async function PostDetailAsync({
  postId,
  focus,
}: {
  postId: string;
  focus?: string;
}) {
  const posts = await getDashboardPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) notFound();

  return (
    <>
      <h1 className="sr-only">Post by {post.author.name}</h1>
      {/* The post itself is the feed card's twin (PostDetailBody):
          byline, Book body, photos, quiet counters, ••• report menu */}
      <PostDetailBody post={post} />
      {/* Hairline above the comments — the same divider the feed
          card draws above its comment entry */}
      <div className="h-px w-full bg-placeholder" aria-hidden="true" />
      <CommentSection
        initialComments={post.comments}
        autoFocusComment={focus === "comment"}
      />
    </>
  );
}

export default async function PostDetailPage({ params, searchParams }: DetailPageProps) {
  const [{ postId }, { focus }] = await Promise.all([params, searchParams]);

  return (
    <AppShell
      panel={
        <Suspense fallback={<NotificationsSkeleton />}>
          <NotificationsPanelAsync />
        </Suspense>
      }
      variant="detail"
      backLabel="Feed"
      backHref="/"
    >
      <div className="page-enter ml-[28px] flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
        {/* P1-C #20: one real h1 per page — visually hidden so the design
            (small author name span) is untouched. */}
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetailAsync postId={postId} focus={focus} />
        </Suspense>
      </div>
    </AppShell>
  );
}
