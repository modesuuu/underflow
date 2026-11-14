// features/collaborations/sort.ts
// Pure helpers — no "use client", no side effects.

import type { CollabProject } from "./types";
import { getActiveLang } from "@/lib/i18n/format";

/**
 * Parse a due date deterministically. Accepts the contract wire format
 * (ISO 8601 "2026-12-25", audit P1-A #5) AND the legacy display string
 * "Dec 25, 26" until every producer has moved to ISO.
 * Two-digit year → 2000 + yy. No Date.parse for the display form.
 */
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDueDate(raw: string): number {
  const iso = raw.match(ISO_RE);
  if (iso) {
    return Date.UTC(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3])
    );
  }
  // Legacy display form: "MMM D, YY"
  const m = raw.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{2,4})$/);
  if (!m) return Infinity;
  const month = MONTH_MAP[m[1]];
  if (month === undefined) return Infinity;
  const day = parseInt(m[2], 10);
  const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  return new Date(year, month, day).getTime();
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a due date for display ("Dec 25, 26"). Contract wire dates are ISO
 * (audit P1-A #5) — display strings are frontend-only, never over the wire.
 * Falls back to the raw value when it is not an ISO date.
 */
export function formatDueDate(raw: string): string {
  const iso = raw.match(ISO_RE);
  if (!iso) return raw;
  const d = new Date(
    Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  );
  if (getActiveLang() === "id") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(d);
  }
  return `${MONTH_NAMES[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${String(
    d.getUTCFullYear()
  ).slice(-2)}`;
}

/**
 * Parse a posted-ago label like "3d ago" or "5h ago".
 * Returns day count (fractional OK). Smaller value = more recent.
 * Returns Infinity for unparseable strings.
 *
 * NOT used for sorting anymore (audit P1-1): labels coarser than a day
 * ("just now" covers 0–59 min) all parse to Infinity, so the newest
 * projects sorted LAST. Kept exported for display-side use only —
 * sorting reads the `postedAt` ISO timestamp instead.
 */
export function parsePostedAgo(raw: string): number {
  const idMatch = raw.match(/^(\d+)\s*(hari|jam|mnt)\s*lalu$/);
  if (idMatch) {
    const v = parseInt(idMatch[1], 10);
    return idMatch[2] === "hari" ? v : idMatch[2] === "jam" ? v / 24 : v / (60 * 24);
  }
  if (raw === "baru saja") return Infinity;
  const m = raw.match(/^(\d+)\s*(\w+)\s*ago$/);
  if (!m) return Infinity;
  const value = parseInt(m[1], 10);
  switch (m[2].toLowerCase()) {
    case "m":  return value / (60 * 24);
    case "h":  return value / 24;
    case "d":  return value;
    case "w":  return value * 7;
    case "mo": return value * 30;
    case "y":  return value * 365;
    default:   return Infinity;
  }
}

/** Sort a list of projects by the given sort key. Returns a new array. */
export function sortProjects(projects: CollabProject[], sortKey: "recommended" | "due" | "newest"): CollabProject[] {
  if (sortKey === "recommended") return [...projects];
  if (sortKey === "due") {
    return [...projects].sort(
      (a, b) => parseDueDate(a.dueDate) - parseDueDate(b.dueDate)
    );
  }
  // "newest": sort by the `postedAt` ISO timestamp (audit P1-1), never by
  // the `postedAgo` label — "just now" collapses 0–59 min into one bucket
  // and used to push the newest projects to the end. Missing/invalid
  // timestamps sort last.
  return [...projects].sort((a, b) => {
    const ta = a.postedAt ? new Date(a.postedAt).getTime() : NaN;
    const tb = b.postedAt ? new Date(b.postedAt).getTime() : NaN;
    const va = Number.isNaN(ta) ? -Infinity : ta;
    const vb = Number.isNaN(tb) ? -Infinity : tb;
    return vb - va;
  });
}
