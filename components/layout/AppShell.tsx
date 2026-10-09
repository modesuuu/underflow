"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar, type TopBarVariant } from "./TopBar";
import { Icon } from "@/components/ui/Icon";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="absolute left-4 top-12 z-50 flex cursor-pointer items-center justify-center rounded-md p-2 text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:hidden"
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
        data-testid="mobile-menu-button"
      >
        <Icon name="menu" size={24} />
      </button>

      {/* Sidebar - full overlay on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-(--uf-sidebar-w) transform bg-bg transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar />
        
        {/* Overlay when sidebar is open on mobile */}
        {sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-10 bg-black/50 md:hidden"
            aria-label="Close navigation"
          />
        )}
      </div>

      {/* Main content - pushed down by top bar padding on mobile */}
      <main className="no-scrollbar min-w-0 flex-1 overflow-y-auto bg-surface pt-12 md:pt-0">
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