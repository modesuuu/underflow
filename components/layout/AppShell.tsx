import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar, type TopBarVariant } from "./TopBar";

interface AppShellProps {
  children: ReactNode;
  panel?: ReactNode;
  breadcrumbRoot?: string;
  breadcrumbLeaf?: string;
  backLabel?: string;
  backHref?: string;
  variant?: TopBarVariant;
  hideTopBar?: boolean;
  /** Page-specific TopBar right-side actions; replaces the default Post button. */
  actions?: ReactNode;
}

/* The shell is: the graphite rail (navigation), the ruled pad (the work
   area), and the panel as a second column on the pad. The ruled grid lives
   on the scrolling `main` (`.pad-ruled`) so it scrolls with the content and
   never paints over the rail or the panel. */
export function AppShell({
  children,
  panel,
  breadcrumbRoot = "Dashboard",
  breadcrumbLeaf = "Feed",
  backLabel = "Feed",
  backHref,
  variant = "dashboard",
  hideTopBar = false,
  actions,
}: AppShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg">
      <Sidebar />
      <main className="pad-ruled no-scrollbar min-w-0 flex-1 overflow-y-auto bg-bg">
        {!hideTopBar && (
          <TopBar
            breadcrumbRoot={breadcrumbRoot}
            breadcrumbLeaf={breadcrumbLeaf}
            backLabel={backLabel}
            backHref={backHref}
            variant={variant}
            actions={actions}
          />
        )}
        {children}
      </main>
      {panel !== undefined && (
        <aside className="no-scrollbar w-(--uf-panel-w) shrink-0 overflow-y-auto border-l border-line bg-bg">
          {panel}
        </aside>
      )}
    </div>
  );
}