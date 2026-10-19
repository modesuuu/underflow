import { useSyncExternalStore } from "react";

/**
 * Mobile drawer state for the Sidebar.
 *
 * Below lg the Sidebar leaves the layout flow and becomes a drawer;
 * the TopBar hamburger opens it, and the backdrop, Escape, a route
 * change, or tapping any nav link closes it. The Sidebar itself lives
 * in RootShell while the TopBar lives in each page's AppShell, so the
 * open state has to be shared across that boundary — same module-store
 * idiom as the like store and the inbox store.
 */

let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMobileNav(next: boolean) {
  if (open === next) return;
  open = next;
  emit();
}

export function useMobileNavOpen() {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}
