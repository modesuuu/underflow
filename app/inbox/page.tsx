import { AppShell } from "@/components/layout/AppShell";
import { InboxShell } from "@/features/inbox/components/InboxShell";

/**
 * Inbox (Figma 386:5, breadcrumb "Tools / Inbox"): the Messages rail
 * and chat pane fill the main area under the standard shell. State
 * is API-backed (features/inbox/store syncs with /api/inbox/*).
 */
export default function InboxPage() {
  return (
    <AppShell breadcrumbRoot="Tools" breadcrumbLeaf="Inbox" fill>
      <h1 className="sr-only">Inbox</h1>
      <InboxShell />
    </AppShell>
  );
}
