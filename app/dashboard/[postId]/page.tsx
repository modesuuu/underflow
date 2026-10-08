import type { Metadata } from "next";
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
        {/* P1-C #20: one real h1 per page — visually hidden so the design
            (small author name span) is untouched. */}
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