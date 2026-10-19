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
      <div className="mx-auto w-full max-w-(--uf-content-w) px-4 lg:mx-0 lg:ml-[28px] lg:px-0">
        <NotificationsPanel />
      </div>
    </AppShell>
  );
}
