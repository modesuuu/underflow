import type { DictKey } from "@/lib/i18n/dictionary";

/**
 * The backend sends the collaboration status as a raw key; the label
 * is translated here. "closed" has no collab.* key of its own.
 */
export function circleStatusKey(status: string): DictKey {
  if (status === "completed") return "collab.statusCompleted";
  if (status === "closed") return "circle.statusClosed";
  return "collab.statusOpen";
}
