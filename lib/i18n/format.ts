// format.ts — language-aware formatting for non-React code (data
// mappers, stores) plus the single translate() implementation the
// React provider also uses. The provider keeps the active language
// in sync via setActiveLang; before hydration (and on the server)
// it is English, matching the server render.

import { en, id, type DictKey } from "./dictionary";

export type Lang = "en" | "id";

let activeLang: Lang = "en";

export function setActiveLang(lang: Lang) {
  activeLang = lang;
}

export function getActiveLang(): Lang {
  return activeLang;
}

export function localeTag(lang: Lang = activeLang): string {
  return lang === "id" ? "id-ID" : "en-GB";
}

export function translate(
  lang: Lang,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  const dict = lang === "id" ? id : en;
  let out: string = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}

/** Translate with the currently active language (module-level). */
export function tStatic(
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  return translate(activeLang, key, vars);
}

/**
 * "just now" / "3h ago" / "2d ago" — localized. Mirrors the buckets
 * the app's mappers have always used (under an hour is "just now";
 * there is no minutes bucket).
 */
export function formatRelativeAgo(iso: string, lang: Lang = activeLang): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return lang === "id" ? `${days} hari lalu` : `${days}d ago`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return lang === "id" ? `${hours} jam lalu` : `${hours}h ago`;
  return lang === "id" ? "baru saja" : "just now";
}

/**
 * Finer variant with a minutes bucket ("just now" / "5m ago" /
 * "3h ago" / "2d ago") — notifications use this; their mapper has
 * always had the minutes bucket.
 */
export function formatRelativeAgoFine(iso: string, lang: Lang = activeLang): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return lang === "id" ? "baru saja" : "just now";
  if (minutes < 60) return lang === "id" ? `${minutes} mnt lalu` : `${minutes}m ago`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return lang === "id" ? `${hours} jam lalu` : `${hours}h ago`;
  const days = Math.floor(ms / 86_400_000);
  return lang === "id" ? `${days} hari lalu` : `${days}d ago`;
}

/** Compact list label: "now" / "5min" / "3h" / "2d" — localized. */
export function formatShortAgo(iso: string, lang: Lang = activeLang): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 60_000) return lang === "id" ? "baru" : "now";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return lang === "id" ? `${minutes}mnt` : `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === "id" ? `${hours}j` : `${hours}h`;
  return lang === "id" ? `${Math.floor(hours / 24)}hari` : `${Math.floor(hours / 24)}d`;
}
