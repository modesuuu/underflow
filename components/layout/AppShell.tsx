import type { ReactNode } from "react";
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
  /**
   * "none" renders without the left Sidebar and without any bottom nav
   * (Profile section — Figma 414:822 draws the Profile with no nav
   * chrome at all). Default keeps the standard sidebar every other
   * page uses.
   */
  navVariant?: "sidebar" | "none";
  /** Page-specific TopBar right-side actions; replaces the default Post button. */
  actions?: ReactNode;
  /**
   * App-like page (e.g. Inbox): main becomes a non-scrolling flex
   * column and the children fill exactly the space below the TopBar.
   * Without it, a child that is h-full adds the TopBar's 79px on top
   * of main's height, so main scrolls and the panes slide under the
   * sticky bar.
   */
  fill?: boolean;
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
  fill = false,
}: AppShellProps) {
  if (navVariant === "none") {
    return (
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
          <main className="no-scrollbar w-full flex-none overflow-visible bg-surface app-canvas xl:min-w-0 xl:flex-1 xl:overflow-y-auto">
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
            <aside className="no-scrollbar w-full flex-none overflow-visible border-t border-line bg-surface xl:w-(--uf-panel-w) xl:shrink-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
              {panel}
            </aside>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
      <main
        className={
          fill
            ? "no-scrollbar flex w-full flex-none flex-col overflow-hidden bg-surface app-canvas max-xl:h-full xl:min-w-0 xl:flex-1"
            : "no-scrollbar w-full flex-none overflow-visible bg-surface app-canvas xl:min-w-0 xl:flex-1 xl:overflow-y-auto"
        }
      >
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
        {fill ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : (
          children
        )}
      </main>
      {panel !== undefined && (
        <aside className="no-scrollbar w-full flex-none overflow-visible border-t border-line bg-surface xl:w-(--uf-panel-w) xl:shrink-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
          {panel}
        </aside>
      )}
    </div>
  );
}