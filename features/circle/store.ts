"use client";

import { useSyncExternalStore } from "react";
import type { ZoneMessage } from "./types";

/**
 * Circle right-panel visibility (client-only UI state). null = follow
 * the viewport default (open at >=1280px); a boolean is the user's
 * override from the header toggle. Data fetching lives in the loaders;
 * this store holds no data.
 */
let panelOpen: boolean | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPanelOpen(open: boolean): void {
  panelOpen = open;
  listeners.forEach((listener) => listener());
}

export function usePanelState(): { open: boolean | null } {
  const open = useSyncExternalStore(
    subscribe,
    () => panelOpen,
    () => null
  );
  return { open };
}

/**
 * Zone-message live bridge (Circle Phase 2). LivePoller owns the
 * single WebSocket and forwards every "zone-message" push here;
 * the open zone conversation subscribes for its circle + zone and
 * appends. Same fan-out idiom as the inbox store's apply functions.
 */
export interface ZoneMessageEvent {
  circleId: string;
  zoneId: string;
  message: ZoneMessage;
}

const zoneMessageListeners = new Set<(event: ZoneMessageEvent) => void>();

export function subscribeZoneMessages(
  listener: (event: ZoneMessageEvent) => void
): () => void {
  zoneMessageListeners.add(listener);
  return () => {
    zoneMessageListeners.delete(listener);
  };
}

export function applyRealtimeZoneMessage(event: ZoneMessageEvent): void {
  zoneMessageListeners.forEach((listener) => listener(event));
}
