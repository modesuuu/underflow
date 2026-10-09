import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { CommentSection } from "@/features/dashboard/components/CommentSection";
import { LikeButton } from "@/features/dashboard/components/LikeButton";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { PhotoViewer } from "@/features/dashboard/components/PhotoViewer";
import { formatCount } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { Icon } from "@/components/ui/Icon";

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
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
      {/* Post card */}
      <div className="rounded-xl border border-line bg-surface p-5">
        {/* Author row */}
        <div className="flex items-center gap-3">
          <div className="size-8 shrink-0 rounded-full bg-placeholder" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 rounded bg-placeholder" />
            <div className="h-3 w-16 rounded bg-placeholder" />
          </div>
        </div>
        {/* Body */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="h-3.5 w-full rounded bg-placeholder" />
          <div className="h-3.5 w-5/6 rounded bg-placeholder" />
          <div className="h-3.5 w-2/3 rounded bg-placeholder" />
        </div>
        {/* Photo area — single big block like the real PhotoViewer/PhotoGrid,
            not a small 2x2 grid */}
        <div className="mt-4 h-[306px] rounded-md bg-placeholder/60" />
        {/* Action counters */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-6 w-14 rounded bg-placeholder" />
          <div className="h-6 w-14 rounded bg-placeholder" />
          <div className="h-6 w-20 rounded bg-placeholder" />
        </div>
      </div>

      {/* Comment section */}
      <div className="flex flex-col gap-6">
        {/* Input bar */}
        <div className="flex items-center gap-3">
          <div className="size-8 shrink-0 rounded-full bg-placeholder" />
          <div className="flex h-[42px] flex-1 items-center rounded-lg border border-accent bg-surface p-2">
            <div className="h-3.5 w-1/2 rounded bg-placeholder" />
          </div>
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
      {/* Post header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar size={32} src={post.author.avatarUrl} alt={post.author.name} />
          <div className="flex flex-col">
            <span className="text-base font-medium">{post.author.name}</span>
            <span className="text-2xs text-subtle">{post.postedAgo}</span>
          </div>
        </div>
        {/* P1-C #18: the "Post options" button had no onClick / no menu —
            removed until the options menu exists (same for PostCard). */}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6">
        <p className="text-base font-medium">{post.text}</p>
        <div className="flex flex-col gap-6">
          <PhotoViewer photos={post.photos} />
          {/* Counters */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Icon name="show" size={24} className="text-ink" />
              <span className="text-2xs font-medium">{formatCount(post.views)}</span>
            </span>
            <span className="flex items-center gap-1">
              <LikeButton
                storeKey={post.id}
                initialLiked={post.liked}
                initialLikes={post.likes}
              />
            </span>
            <span className="flex items-center gap-1">
              <Icon name="message-rounded" size={24} className="text-ink" />
              <span className="text-2xs font-medium">Comment</span>
            </span>
          </div>
        </div>
      </div>

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
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
        {/* P1-C #20: one real h1 per page — visually hidden so the design
            (small author name span) is untouched. */}
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetailAsync postId={postId} focus={focus} />
        </Suspense>
      </div>
    </AppShell>
  );
}