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

const EMPTY: SearchResults = { users: [], projects: [], skills: [] };

/**
 * Global search (audit P2 #21): lives in the TopBar on lg+
 * screens and queries /api/search (people, projects, system
 * skills). Hidden on /collaborations, which has its own
 * dedicated search pill in the same bar; skill results link
 * there with ?q= instead. Phones keep the page-level search
 * affordances that already exist.
 */
export function GlobalSearch() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  // Close and reset whenever the route changes.
  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

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

  if (pathname?.startsWith("/collaborations")) return null;

  const q = query.trim();
  const hasResults =
    results.users.length > 0 || results.projects.length > 0 || results.skills.length > 0;
  const showPanel = open && q.length >= 1;

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
      {showPanel && (
        <div className="absolute top-full right-0 z-30 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-xl">
          {q.length < 2 ? (
            <p className="px-3 py-2 text-sm text-subtle">{t("search.hint")}</p>
          ) : loading ? (
            <p className="px-3 py-2 text-sm text-subtle">{t("common.loading")}</p>
          ) : !hasResults ? (
            <p className="px-3 py-2 text-sm text-subtle">
              {t("search.noResults", { q })}
            </p>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
                    {t("search.people")}
                  </p>
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                    >
                      <Avatar
                        src={user.photo ?? undefined}
                        alt={user.full_name ?? user.username}
                        size={28}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {user.full_name ?? user.username}
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
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                    >
                      <span className="text-sm font-medium text-ink">{skill.skill_name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
