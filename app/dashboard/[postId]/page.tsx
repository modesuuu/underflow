import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { CommentSection } from "@/features/dashboard/components/CommentSection";
import { LikeButton } from "@/features/dashboard/components/LikeButton";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { PhotoViewer } from "@/features/dashboard/components/PhotoViewer";
import { formatCount } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

interface DetailPageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ focus?: string }>;
}

/**
 * The page renders its shell synchronously and only suspends on the
 * data-bound sections (post body + notifications panel), so navigation shows
 * this page's own shape. Fallbacks mirror the real sections.
 */
function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-7 p-6">
      <div className="h-5 w-32 rounded-sm bg-placeholder" />
      <div className="flex h-8 w-full border border-rule">
        <div className="flex-1 bg-placeholder/40" />
        <div className="flex-1 border-l border-rule bg-placeholder/40" />
        <div className="flex-1 border-l border-rule bg-placeholder/40" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="size-[30px] shrink-0 rounded-full bg-placeholder" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-3/4 rounded-sm bg-placeholder" />
            <div className="h-3 w-1/2 rounded-sm bg-placeholder" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="sheet flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <div className="size-9 shrink-0 rounded-full bg-placeholder" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-28 rounded-sm bg-placeholder" />
          <div className="h-3 w-16 rounded-sm bg-placeholder" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-full rounded-sm bg-placeholder" />
        <div className="h-3.5 w-5/6 rounded-sm bg-placeholder" />
        <div className="h-3.5 w-2/3 rounded-sm bg-placeholder" />
      </div>
      <div className="h-[306px] w-full rounded-sm bg-placeholder/60" />
      <div className="flex gap-5 border-t border-rule pt-4">
        <div className="h-5 w-12 rounded-sm bg-placeholder" />
        <div className="h-5 w-12 rounded-sm bg-placeholder" />
        <div className="h-5 w-20 rounded-sm bg-placeholder" />
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
      <article className="sheet flex flex-col gap-5 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar size={36} src={post.author.avatarUrl} alt={post.author.name} />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">
              {post.author.name}
            </span>
            <span className="font-figures text-2xs text-subtle">
              {post.postedAgo}
            </span>
          </div>
        </div>

        <p className="text-base leading-relaxed text-ink">{post.text}</p>

        <PhotoViewer photos={post.photos} />

        {/* Counters */}
        <div className="flex items-center gap-5 border-t border-rule pt-4">
          <span className="flex items-center gap-1.5">
            <Icon name="show" size={22} className="text-muted" />
            <span className="font-figures text-2xs font-medium text-muted">
              {formatCount(post.views)}
            </span>
          </span>
          <LikeButton
            storeKey={post.id}
            initialLiked={post.liked}
            initialLikes={post.likes}
          />
          <span className="flex items-center gap-1.5">
            <Icon name="message-rounded" size={22} className="text-muted" />
            <span className="text-2xs font-medium text-muted">Comment</span>
          </span>
        </div>
      </article>

      <CommentSection
        initialComments={post.comments}
        autoFocusComment={focus === "comment"}
      />
    </>
  );
}

export default async function PostDetailPage({
  params,
  searchParams,
}: DetailPageProps) {
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
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 py-6">
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetailAsync postId={postId} focus={focus} />
        </Suspense>
      </div>
    </AppShell>
  );
}