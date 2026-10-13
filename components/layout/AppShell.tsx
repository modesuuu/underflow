import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar, type TopBarVariant } from "./TopBar";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  panel?: ReactNode;
  breadcrumbRoot?: string;
  breadcrumbLeaf?: string;
  backLabel?: string;
  backHref?: string;
  variant?: TopBarVariant;
  hideTopBar?: boolean;
  /**
   * "bottom" replaces the left Sidebar with a mobile-style bottom nav
   * (Profile section — its Figma frames draw no sidebar). Default keeps
   * the standard sidebar chrome every other page uses.
   */
  navVariant?: "sidebar" | "bottom";
  /** Page-specific TopBar right-side actions; replaces the default Post button. */
  actions?: ReactNode;
}


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
  navVariant = "sidebar",
}: AppShellProps) {
  if (navVariant === "bottom") {
    return (
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1">
          <main className="no-scrollbar min-w-0 flex-1 overflow-y-auto bg-surface">
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
            <aside className="no-scrollbar w-(--uf-panel-w) shrink-0 overflow-y-auto border-l border-line bg-surface">
              {panel}
            </aside>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar />
      <main className="no-scrollbar min-w-0 flex-1 overflow-y-auto bg-surface">
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
        <aside className="no-scrollbar w-(--uf-panel-w) shrink-0 overflow-y-auto border-l border-line bg-surface">
          {panel}
        </aside>
      )}
    </div>
  );
}