"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { getInboxSummary } from "@/features/inbox/api";
import {
  CURRENT_USER,
  DEFAULT_ACTIVE_ID,
  FOOTER_LINKS,
  NAV_SECTIONS,
  type NavItem,
  type NavSection,
} from "./nav";

/* Studio Log rail. The sidebar is the graphite field the pad rests on: cream
   ink on #1B1E19, and the active row is a *sheet laid on the rail* rather
   than a white pill. Only transform + opacity animate (compositor-only). */

type RegisterRef<T> = (id: string, el: T | null) => void;

interface NavRowProps {
  item: NavItem;
  active: boolean;
  badge?: number;
  onSelect: (id: string) => void;
  registerRef: RegisterRef<HTMLElement>;
}

function NavRow({ item, active, badge, onSelect, registerRef }: NavRowProps) {
  // Items with an href are real <Link> anchors — Next.js prefetches the
  // destination route shell on hover/appearance, so a slow compile no longer
  // flashes the wrong skeleton first (button + router.push has no prefetch).
  const className = clsx(
    "relative z-10 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left",
    !active && "nav-row-hoverable"
  );

  const inner = (
    <>
      <Icon
        name={item.icon}
        size={18}
        className={active ? "text-ink" : "text-rail-muted"}
      />
      <span
        className={clsx(
          "text-xs font-medium",
          active ? "text-ink" : "text-rail-muted"
        )}
      >
        {item.label}
      </span>
      {badge !== undefined && badge > 0 && (
        <Badge count={badge} tone="danger" className="ml-auto" />
      )}
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        ref={(el) => {
          registerRef(item.id, el);
        }}
        onClick={() => {
          onSelect(item.id);
        }}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      ref={(el) => {
        registerRef(item.id, el);
      }}
      onClick={() => {
        onSelect(item.id);
      }}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </button>
  );
}

interface NavSectionBlockProps {
  section: NavSection;
  activeId: string;
  collapsed: boolean;
  badgeFor: (id: string) => number | undefined;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  registerRowRef: RegisterRef<HTMLElement>;
}

function NavSectionBlock({
  section,
  activeId,
  collapsed,
  badgeFor,
  onToggle,
  onSelect,
  registerRowRef,
}: NavSectionBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        aria-expanded={!collapsed}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        {/* Section titles are 11px sentence-case labels, not all-caps
            eyebrows (banned in DESIGN.md). */}
        <span className="text-2xs font-semibold tracking-[0.06em] text-rail-muted">
          {section.title}
        </span>
        <span
          className={
            "chevron-rot inline-flex " +
            (collapsed ? "-rotate-90" : "rotate-0")
          }
        >
          <Icon name="chevron-down" size={18} className="text-rail-muted" />
        </span>
      </button>
      <div
        className={
          collapsed
            ? "acc-wrap [grid-template-rows:0fr]"
            : "acc-wrap [grid-template-rows:1fr]"
        }
      >
        <div className="acc-inner flex flex-col gap-0.5">
          {section.items.map((item) => (
            <NavRow
              key={item.id}
              item={item}
              active={item.id === activeId}
              badge={badgeFor(item.id)}
              onSelect={onSelect}
              registerRef={registerRowRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Map a pathname to the nav item id that should be active. */
function routeToNavId(pathname: string): string {
  if (pathname.startsWith("/my-collaborations")) return "my-collab";
  if (pathname.startsWith("/collaborations")) return "collaborations";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "feeds";
  return DEFAULT_ACTIVE_ID;
}

export function Sidebar() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState(() => routeToNavId(pathname));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [inboxUnread, setInboxUnread] = useState(0);

  const areaRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const firstPill = useRef(true);

  useEffect(() => {
    setActiveId(routeToNavId(pathname));
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    getInboxSummary()
      .then((summary) => {
        if (!cancelled) setInboxUnread(summary.unreadCount);
      })
      .catch(() => {
        // Mock path cannot fail; real API errors just hide the badge.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const badgeFor = (id: string) =>
    id === "inbox" && inboxUnread > 0 ? inboxUnread : undefined;

  const activeVisible = useMemo(() => {
    for (const section of NAV_SECTIONS) {
      if (section.items.some((item) => item.id === activeId)) {
        return !collapsed[section.id];
      }
    }
    return true;
  }, [activeId, collapsed]);

  /* The active sheet is positioned with translateY + opacity only (both
     compositor-only). Its fixed height matches a nav row, so no layout tween
     is needed. */
  const positionPill = () => {
    const area = areaRef.current;
    const pill = pillRef.current;
    if (!area || !pill) return;
    const row = rowRefs.current.get(activeId);
    if (!row) {
      pill.style.opacity = "0";
      return;
    }
    const y =
      row.getBoundingClientRect().top - area.getBoundingClientRect().top;
    if (firstPill.current) {
      pill.style.transition = "none";
      pill.style.transform = `translateY(${y}px)`;
      pill.style.opacity = activeVisible ? "1" : "0";
      void pill.offsetWidth; // flush so the next change animates via CSS
      pill.style.transition = "";
      firstPill.current = false;
      return;
    }
    pill.style.transform = `translateY(${y}px)`;
    pill.style.opacity = activeVisible ? "1" : "0";
  };

  const positionPillRef = useRef(positionPill);
  positionPillRef.current = positionPill;

  useLayoutEffect(() => {
    positionPillRef.current();
  }, [activeId, activeVisible]);

  const toggleSection = (id: string) => {
    const isCollapsed = !!collapsed[id];
    setCollapsed((prev) => ({ ...prev, [id]: !isCollapsed }));
    window.setTimeout(() => positionPillRef.current(), 320);
  };

  const registerRow: RegisterRef<HTMLElement> = (id, el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  return (
    <aside className="w-(--uf-sidebar-w) shrink-0 bg-rail text-rail-ink">
      <div
        ref={areaRef}
        className="relative flex h-full flex-col justify-between px-6 py-6"
      >
        {/* The active sheet laid on the rail. */}
        <div
          ref={pillRef}
          className="active-pill absolute left-6 right-6 top-0 z-0 h-9 rounded-md"
          style={{ opacity: 0, backgroundColor: "var(--uf-rail-ink)" }}
        />

        <div className="flex flex-col gap-8">
          {/* Brand: the mark is a ruled square, not a soft rounded placeholder */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-[30px] w-[30px] items-center justify-center rounded-sm border border-rail-muted/40">
              <span className="h-px w-3 bg-rail-muted/70" />
              <span className="absolute h-3 w-px bg-rail-muted/70" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-rail-ink">
                Stack Underflow
              </span>
              {/* The rail is the log's spine; this is its volume mark. */}
              <span className="font-figures text-3xs text-rail-muted">
                VOL. 01 — WORKLOG
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-7">
            {NAV_SECTIONS.map((section) => (
              <NavSectionBlock
                key={section.id}
                section={section}
                activeId={activeId}
                collapsed={!!collapsed[section.id]}
                badgeFor={badgeFor}
                onToggle={toggleSection}
                onSelect={setActiveId}
                registerRowRef={registerRow}
              />
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            {FOOTER_LINKS.map((link) => (
              <NavRow
                key={link.id}
                item={link}
                active={link.id === activeId}
                onSelect={setActiveId}
                registerRef={registerRow}
              />
            ))}
          </div>

          <div className="h-px w-full bg-rail-ink/15" />

          {/* Profile: a sheet edge on the rail. */}
          <div className="relative z-10 flex items-center justify-between rounded-md border border-rail-ink/15 bg-rail-ink/[0.06] p-1.5">
            <div className="flex items-center gap-2">
              <Avatar size={28} rounded="sm" alt={CURRENT_USER.name} />
              <div className="flex w-[97px] flex-col gap-0.5">
                <span className="text-2xs font-medium text-rail-ink">
                  {CURRENT_USER.name}
                </span>
                <span className="truncate font-figures text-3xs text-rail-muted">
                  {CURRENT_USER.email}
                </span>
              </div>
            </div>
            <Icon
              name="chevrons-up-down"
              size={18}
              className="text-rail-muted"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}