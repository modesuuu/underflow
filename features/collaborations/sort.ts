// features/collaborations/sort.ts
// Pure helpers — no "use client", no side effects.

import type { CollabProject } from "./types";

/**
 * Parse a due date like "Dec 25, 26" deterministically.
 * Two-digit year → 2000 + yy. No Date.parse (locale-dependent).
 */
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseDueDate(raw: string): number {
  // Format: "MMM D, YY"
  const m = raw.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{2,4})$/);
  if (!m) return Infinity;
  const month = MONTH_MAP[m[1]];
  if (month === undefined) return Infinity;
  const day = parseInt(m[2], 10);
  const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  return new Date(year, month, day).getTime();
}

/**
 * Parse a posted-ago label like "3d ago" or "5h ago".
 * Returns day count (fractional OK). Smaller value = more recent.
 * Returns Infinity for unparseable strings (sorts to end for "newest").
 */
export function parsePostedAgo(raw: string): number {
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
  // "newest": smaller postedAgo value = more recently posted
  return [...projects].sort(
    (a, b) => parsePostedAgo(a.postedAgo) - parsePostedAgo(b.postedAgo)
  );
}
