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
      <FeedColumn posts={posts} />
    </AppShell>
  );
}