import { AppShell } from "@/components/layout/AppShell";
import { PostButton } from "@/components/layout/PostButton";
import { NotificationsPanel } from "@/features/dashboard/components/NotificationsPanel";

export default function NotificationsPage() {
  return (
    <AppShell
      breadcrumbRoot="Dashboard"
      breadcrumbLeaf="Notifications"
      backLabel="Feed"
      backHref="/"
      actions={<PostButton />}
    >
      <h1 className="sr-only">Notifications</h1>
      <div className="w-full px-4 sm:px-6">
        <NotificationsPanel />
      </div>
    </AppShell>
  );
}
