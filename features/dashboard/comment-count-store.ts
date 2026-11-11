import { useSyncExternalStore } from "react";

/**
 * Session-scoped comment-count state, shared across every view of the
 * same post — mirrors like-store.ts, but the count is the only state
 * (there is no local `commented` boolean to preserve).
 *
 * The feed seeds each post's count from its server prop; the LivePoller
 * overwrites the count from a fresh GET /api/posts so new comments by
 * other people tick the number up without a refresh.
 */

const store = new Map<string, number>();
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

function seed(key: string, initialCount: number) {
  if (!store.has(key)) {
    store.set(key, initialCount);
  }
}

function getSnapshot(key: string, initialCount: number): number {
  return store.get(key) ?? initialCount;
}

/**
 * Overwrite the count for a post (from a fresh server fetch). Creates
 * the entry if the post has not rendered yet — the count is plain
 * server state, so seeding from the server is always correct.
 */
export function setCommentCount(key: string, count: number) {
  if (store.get(key) === count) return;
  store.set(key, count);
  emit();
}

/**
 * Read the live comment count for one post. Seeded from the post's
 * server count the first time the key is accessed.
 */
export function useCommentCount(key: string, initialCount: number): number {
  seed(key, initialCount);
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(key, initialCount),
    () => getSnapshot(key, initialCount)
  );
}
