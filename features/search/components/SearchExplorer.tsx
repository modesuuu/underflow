"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
 * The global search page (user order 2026-11-16: a page of
 * its own instead of the TopBar dropdown). Same /api/search
 * endpoint, page-scale layout: people, projects, and system
 * skills; skill rows land on /collaborations pre-filtered.
 * A ?q= in the URL seeds the first search, so the page can
 * be deep-linked.
 */
export function SearchExplorer() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

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

  const q = query.trim();
  const hasResults =
    results.users.length > 0 || results.projects.length > 0 || results.skills.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16 sm:px-6">
      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          autoFocus
          className="w-full rounded-full border border-line bg-surface py-3 pr-4 pl-12 text-base text-ink shadow-sm transition-colors outline-none placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div className="pt-6">
        {q.length < 2 ? (
          <p className="px-1 text-sm text-subtle">{t("search.hint")}</p>
        ) : loading ? (
          <p className="px-1 text-sm text-subtle">{t("common.loading")}</p>
        ) : !hasResults ? (
          <p className="px-1 text-sm text-subtle">{t("search.noResults", { q })}</p>
        ) : (
          <div className="flex flex-col gap-8">
            {results.users.length > 0 && (
              <section>
                <h2 className="px-1 pb-2 text-xs font-semibold tracking-wide text-subtle uppercase">
                  {t("search.people")}
                </h2>
                <div className="flex flex-col">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
              </section>
            )}
            {results.projects.length > 0 && (
              <section>
                <h2 className="px-1 pb-2 text-xs font-semibold tracking-wide text-subtle uppercase">
                  {t("search.projects")}
                </h2>
                <div className="flex flex-col">
                  {results.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/collaborations/${project.id}`}
                      className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
              </section>
            )}
            {results.skills.length > 0 && (
              <section>
                <h2 className="px-1 pb-2 text-xs font-semibold tracking-wide text-subtle uppercase">
                  {t("search.skills")}
                </h2>
                <div className="flex flex-col">
                  {results.skills.map((skill) => (
                    <Link
                      key={skill.id}
                      href={`/collaborations?q=${encodeURIComponent(skill.skill_name)}`}
                      className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                    >
                      <span className="text-sm font-medium text-ink">{skill.skill_name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
