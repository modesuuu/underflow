import { useSyncExternalStore } from "react";

/**
 * Session-scoped like state, shared across every view of the same entity.
 *
 * The feed and the post detail page render the same post through different
 * components, and comment likes live in the detail page only — but a like
 * toggled anywhere must read back everywhere that entity is shown. Without
 * a shared store, the feed's local useState and the detail page's static
 * mock value drift apart the moment you navigate.
 *
 * TODO(backend): this state lives in session memory — it survives
 * client-side navigation and dies on a full refresh. Real persistence waits
 * on the like API (POST /api/.../like).
 */

interface LikeState {
  liked: boolean;
  likes: number;
}

const store = new Map<string, LikeState>();
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

function seed(key: string, initialLiked: boolean, initialLikes: number) {
  if (!store.has(key)) {
    store.set(key, { liked: initialLiked, likes: initialLikes });
  }
}

function getSnapshot(key: string): LikeState {
  // useSyncExternalStore requires a cached, referentially-stable snapshot —
  // toggles replace the entry with a NEW object, so this read stays cheap
  // and getSnapshotInProgression never returns a mutated value.
  return store.get(key) ?? { liked: false, likes: 0 };
}

/**
 * Toggle a like. Computed purely from the current entry (no setState nested
 * inside an updater — audit P0-2 — StrictMode double-fire cannot shift the
 * count), and the result is stored as a fresh object.
 */
export function toggleLike(key: string) {
  const current = store.get(key);
  if (!current) return;
  const nextLiked = !current.liked;
  store.set(key, {
    liked: nextLiked,
    likes: current.likes + (nextLiked ? 1 : -1),
  });
  emit();
}

/**
 * Read + toggle the like state for one entity. The entry is seeded from the
 * entity's initial values the first time the key is accessed, so the mock
 * baseline (e.g. a post that ships already liked) is respected.
 */
export function useLikeState(
  key: string,
  initialLiked: boolean,
  initialLikes: number
): [LikeState, () => void] {
  seed(key, initialLiked, initialLikes);
  const state = useSyncExternalStore(
    subscribe,
    () => getSnapshot(key),
    () => getSnapshot(key)
  );
  return [state, () => toggleLike(key)];
}
