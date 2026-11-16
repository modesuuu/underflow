"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface SearchUser {
  id: string;
  username: string;
  full_name: string | null;
  photo: string | null;
}
interface SearchProject {
  id: string;
  title: string;
  status: string;
  owner_username: string;
  required_member: number;
  member_count: number;
}
interface SearchSkill {
  id: string;
  skill_name: string;
}
interface SearchResults {
  users: SearchUser[];
  projects: SearchProject[];
  skills: SearchSkill[];
}

interface RecentEntry {
  href: string;
  label: string;
  sub: string;
  photo?: string | null;
}

const EMPTY: SearchResults = { users: [], projects: [], skills: [] };
const RECENT_KEY = "uf-recent-searches";
const RECENT_MAX = 8;

function readRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEntry =>
        !!e && typeof e === "object" && typeof (e as RecentEntry).href === "string",
    );
  } catch {
    return [];
  }
}

function writeRecents(list: RecentEntry[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Private mode / storage full: recents just don't persist.
  }
}

/**
 * TopBar global search, Instagram-style (user order
 * 2026-11-16): focusing the pill drops a wide panel. Empty
 * query shows the user's recent picks (stored locally,
 * removable per item or all at once); typing switches to
 * live results from /api/search, with a footer link to the
 * full results below. The pill mounts ONLY on /search (user
 * revision 2026-11-16): every other page's TopBar stays free
 * of search, and this page's input lives here in the TopBar
 * instead of in the page body.
 */
export function GlobalSearch() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  // Panel entrance: mount at opacity 0 / shifted up, then
  // flip on the next frame so the CSS transition runs
  // (160ms ease-out, compositor properties only).
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    setRecents(readRecents());
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [open ]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    const mine = ++seq.current;
    setLoading(true);
    const timer = setTimeout(() => {
      apiFetch<{ data: SearchResults }>("/api/search?q=" + encodeURIComponent(q))
        .then((res) => {
          if (seq.current !== mine) return;
          const data = res.data;
          setResults({
            users: data?.users ?? [],
            projects: data?.projects ?? [],
            skills: data?.skills ?? [],
          });
          setLoading(false);
        })
        .catch(() => {
          if (seq.current !== mine) return;
          setResults(EMPTY);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!pathname?.startsWith("/search")) {
    return null;
  }

  const q = query.trim();
  const hasResults =
    results.users.length > 0 || results.projects.length > 0 || results.skills.length > 0;
  const showRecents = q.length < 2;

  const recordRecent = (entry: RecentEntry) => {
    const next = [entry, ...readRecents().filter((e) => e.href !== entry.href)].slice(
      0,
      RECENT_MAX,
    );
    writeRecents(next);
    setRecents(next);
  };

  const removeRecent = (href: string) => {
    const next = readRecents().filter((e) => e.href !== href);
    writeRecents(next);
    setRecents(next);
  };

  const clearRecents = () => {
    writeRecents([]);
    setRecents([]);
  };

  return (
    <div
      className="relative hidden lg:block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Icon
        name="search"
        size={16}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
      />
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        className="w-64 rounded-full border border-line bg-surface py-2 pr-4 pl-10 text-sm text-ink transition-all outline-none placeholder:text-subtle focus:w-80 focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      {open && (
        <div
          className={
            "absolute top-full right-0 z-30 mt-2 max-h-[70vh] w-[min(560px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl transition-[opacity,transform] duration-150 ease-out " +
            (entered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")
          }
        >
          {showRecents ? (
            recents.length > 0 ? (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                  <p className="text-xs font-semibold tracking-wide text-subtle uppercase">
                    {t("search.recent")}
                  </p>
                  <button
                    type="button"
                    onClick={clearRecents}
                    className="cursor-pointer text-xs font-medium text-accent hover:underline"
                  >
                    {t("search.clearAll")}
                  </button>
                </div>
                {recents.map((entry) => (
                  <div key={entry.href} className="group flex items-center">
                    <Link
                      href={entry.href}
                      onClick={() => setOpen(false)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                    >
                      {entry.photo !== undefined ? (
                        <Avatar src={entry.photo ?? undefined} alt={entry.label} size={36} />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg">
                          <Icon name="search" size={16} className="text-subtle" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {entry.label}
                        </span>
                        <span className="block truncate text-xs text-subtle">{entry.sub}</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      aria-label={t("search.removeRecent")}
                      onClick={() => removeRecent(entry.href)}
                      className="mr-2 cursor-pointer rounded-full p-1.5 text-subtle transition-colors hover:bg-bg hover:text-ink"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-subtle">{t("search.hint")}</p>
            )
          ) : loading ? (
            <p className="px-5 py-4 text-sm text-subtle">{t("common.loading")}</p>
          ) : !hasResults ? (
            <p className="px-5 py-4 text-sm text-subtle">{t("search.noResults", { q })}</p>
          ) : (
            <>
              <div className="p-2">
                {results.users.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
                      {t("search.people")}
                    </p>
                    {results.users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        onClick={() => {
                          recordRecent({
                            href: `/profile/${user.id}`,
                            label: user.full_name || user.username,
                            sub: "@" + user.username,
                            photo: user.photo,
                          });
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <Avatar
                          src={user.photo ?? undefined}
                          alt={user.full_name || user.username}
                          size={36}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">
                            {user.full_name || user.username}
                          </span>
                          <span className="block truncate text-xs text-subtle">
                            @{user.username}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {results.projects.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
                      {t("search.projects")}
                    </p>
                    {results.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/collaborations/${project.id}`}
                        onClick={() => {
                          recordRecent({
                            href: `/collaborations/${project.id}`,
                            label: project.title,
                            sub:
                              "@" +
                              project.owner_username +
                              " · " +
                              project.member_count +
                              "/" +
                              project.required_member +
                              " · " +
                              project.status,
                          });
                          setOpen(false);
                        }}
                        className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <span className="block truncate text-sm font-medium text-ink">
                          {project.title}
                        </span>
                        <span className="block truncate text-xs text-subtle">
                          @{project.owner_username} · {project.member_count}/
                          {project.required_member} · {project.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {results.skills.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
                      {t("search.skills")}
                    </p>
                    {results.skills.map((skill) => (
                      <Link
                        key={skill.id}
                        href={`/collaborations?q=${encodeURIComponent(skill.skill_name)}`}
                        onClick={() => {
                          recordRecent({
                            href: `/collaborations?q=${encodeURIComponent(skill.skill_name)}`,
                            label: skill.skill_name,
                            sub: t("search.skills"),
                          });
                          setOpen(false);
                        }}
                        className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <span className="text-sm font-medium text-ink">{skill.skill_name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-line p-2">
                <Link
                  href={`/search?q=${encodeURIComponent(q)}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-accent transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  {t("search.seeAll", { q })}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
