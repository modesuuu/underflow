"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/LogoMark";
import { ApiError } from "@/lib/api-client";
import { getAdminOverview } from "../api";
import type { AdminOverview, AdminViewer } from "../types";

/**
 * The admin shell (spec-admin.md §7): its own layout outside the
 * user AppShell. The gate is the overview call itself — the
 * backend AdminMiddleware decides; a 403 renders the denied
 * screen, so a hidden sidebar entry is never the security.
 */

interface AdminContextValue {
  viewer: AdminViewer;
  overview: AdminOverview;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminShell");
  return ctx;
}

const NAV = [
  { href: "/admin", label: "Overview", icon: "home", match: (p: string) => p === "/admin" },
  { href: "/admin/users", label: "Users", icon: "group", match: (p: string) => p.startsWith("/admin/users") },
  { href: "/admin/content", label: "Content", icon: "news", match: (p: string) => p.startsWith("/admin/content") },
];

type GateState =
  | { kind: "loading" }
  | { kind: "denied" }
  | { kind: "error" }
  | { kind: "ready"; overview: AdminOverview };

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setGate({ kind: "loading" });
    getAdminOverview()
      .then((overview) => {
        if (!cancelled) setGate({ kind: "ready", overview });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
          setGate({ kind: "denied" });
        } else {
          setGate({ kind: "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (gate.kind === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg text-sm text-muted">
        Loading admin...
      </div>
    );
  }

  if (gate.kind === "denied") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
        <Icon name="lock-alt" size={28} className="text-muted" />
        <p className="text-base font-medium">Admin access only</p>
        <p className="max-w-sm text-sm text-muted">
          Your account does not have an admin role. If you are on the
          Underflow team, ask a Super Admin to check your role.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent"
        >
          Back to app
        </Link>
      </div>
    );
  }

  const retryScreen = (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
      <p className="text-sm text-muted">Couldn&apos;t reach the admin API.</p>
      <button
        type="button"
        onClick={() => setAttempt((n) => n + 1)}
        className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent"
      >
        Retry
      </button>
    </div>
  );

  if (gate.kind === "error") {
    return retryScreen;
  }

  const { overview } = gate;
  const viewer = overview.viewer;
  if (!viewer) {
    return retryScreen;
  }

  return (
    <AdminContext.Provider value={{ viewer, overview }}>
      <div className="flex h-dvh w-full overflow-hidden bg-bg text-ink">
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-line bg-surface">
          <div className="flex items-center gap-2 px-4 pt-5 pb-4">
            <LogoMark className="h-[22px] w-[22px]" />
            <span className="text-[15px] font-semibold tracking-tight">Underflow</span>
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
              style={{
                background: "color-mix(in srgb, var(--color-warning, #ffce2f) 26%, transparent)",
              }}
            >
              Admin
            </span>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-bg font-medium text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-3 px-4 pb-5">
            <div className="h-px w-full bg-line" />
            <div className="flex items-center gap-2.5">
              <Avatar size={30} alt={viewer.username} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {viewer.username}
                </span>
                <span className="text-xs text-muted">
                  {viewer.role === "super_admin" ? "Super Admin" : "Monitor"}
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted hover:text-ink"
            >
              <Icon name="arrow-back" size={16} />
              Back to app
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}
