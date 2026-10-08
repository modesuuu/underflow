import { AppShell } from "@/components/layout/AppShell";
import { getDashboardPosts, getNotifications } from "@/features/dashboard/api";
import { FeedColumn } from "@/features/dashboard/components/FeedColumn";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

export default async function Home() {
  const [posts, notifications] = await Promise.all([
    getDashboardPosts(),
    getNotifications(),
  ]);

  return (
    <AppShell panel={<NotificationsPanel notifications={notifications} />}>
      {/* P1-C #20: one real h1 per page — visually hidden so the
          breadcrumb in the TopBar stays the visual heading. */}
      <h1 className="sr-only">Feed</h1>
      <FeedColumn posts={posts} />
    </AppShell>
  );
}