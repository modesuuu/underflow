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
}: AppShellProps) {
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