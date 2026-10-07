import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { CommentSection } from "@/features/dashboard/components/CommentSection";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { PhotoViewer } from "@/features/dashboard/components/PhotoViewer";
import { formatCount } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

interface DetailPageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ focus?: string }>;
}

export default async function PostDetailPage({ params, searchParams }: DetailPageProps) {
  const [{ postId }, { focus }] = await Promise.all([params, searchParams]);
  const [posts, notifications] = await Promise.all([
    getDashboardPosts(),
    getNotifications(),
  ]);

  const post = posts.find((p) => p.id === postId);
  if (!post) notFound();

  return (
    <AppShell
      panel={<NotificationsPanel notifications={notifications} />}
      variant="detail"
      backLabel="Feed"
      backHref="/"
    >
      <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
        {/* Post header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar size={32} src={post.author.avatarUrl} alt={post.author.name} />
            <div className="flex flex-col">
              <span className="text-base font-medium">{post.author.name}</span>
              <span className="text-2xs text-subtle">{post.postedAgo}</span>
            </div>
          </div>
          <button type="button" aria-label="Post options" className="cursor-pointer text-muted transition-colors hover:text-ink">
            <Icon name="dots-vertical-rounded" size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6">
          <p className="text-base font-medium">{post.text}</p>
          <div className="flex flex-col gap-6">
            <PhotoViewer photos={post.photos} />
            {/* Counters */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Icon name="show-alt" size={24} className="text-ink" />
                <span className="text-2xs font-medium">{formatCount(post.views)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon name="heart" size={24} className={post.liked ? "text-heart" : "text-ink"} />
                <span className={`text-2xs font-medium ${post.liked ? "text-heart" : "text-ink"}`}>
                  {formatCount(post.likes)}
                </span>
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
      </div>
    </AppShell>
  );
}