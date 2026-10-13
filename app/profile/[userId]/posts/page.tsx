import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PostButton } from "@/components/layout/PostButton";
import { Icon } from "@/components/ui/Icon";
import { getNotifications } from "@/features/dashboard/api";
import { FeedColumn } from "@/features/dashboard/components/FeedColumn";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";
import { getPerson, getPersonPosts } from "@/features/profile/api";

interface ProfilePostsPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePostsPageProps): Promise<Metadata> {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) return { title: "Posts" };
  return { title: `${person.name}'s posts — Bareng` };
}

function FeedColumnSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-6 py-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-placeholder" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 rounded bg-placeholder" />
              <div className="h-3 w-16 rounded bg-placeholder" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-3.5 w-full rounded bg-placeholder" />
            <div className="h-3.5 w-2/3 rounded bg-placeholder" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="aspect-square rounded-md bg-placeholder/60" />
            <div className="aspect-square rounded-md bg-placeholder/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

async function PostsBody({ userId }: { userId: string }) {
  const person = await getPerson(userId);
  if (!person) notFound();
  const posts = await getPersonPosts(person);
  if (posts.length === 0) {
    return (
      <div className="mx-auto w-full max-w-(--uf-content-w) py-3">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <Icon name="image-add" size={32} className="text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">No posts yet</p>
            <p className="text-sm text-muted">
              {person.name} hasn&rsquo;t shared any posts.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <FeedColumn posts={posts} />;
}

async function NotificationsPanelAsync() {
  const notifications = await getNotifications();
  return <NotificationsPanel notifications={notifications} />;
}

export default async function ProfilePostsPage({ params }: ProfilePostsPageProps) {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) notFound();

  return (
    <AppShell
      navVariant="none"
      panel={
        <Suspense fallback={<NotificationsSkeleton />}>
          <NotificationsPanelAsync />
        </Suspense>
      }
      actions={<PostButton />}
      breadcrumbRoot={person.name}
      breadcrumbLeaf="Feed"
      backLabel={person.name}
      backHref={`/profile/${person.id}`}
    >
      <h1 className="sr-only">{`${person.name}'s posts`}</h1>
      <Suspense fallback={<FeedColumnSkeleton />}>
        <PostsBody userId={userId} />
      </Suspense>
    </AppShell>
  );
}
