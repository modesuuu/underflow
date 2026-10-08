"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
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

// P1-E #28 / P1-C #21: the sidebar no longer uses GSAP — the hover
// background, chevron rotation, and section accordion are pure CSS
// transitions (globals.css), so they run on the compositor where
// possible and are fully respected by prefers-reduced-motion. GSAP's
// only remaining job is moving the active pill (its Y/height follow
// the row's layout box — a genuinely JS-positioned element).

type RegisterRef<T> = (id: string, el: T | null) => void;

interface NavRowProps {
  item: NavItem;
  active: boolean;
  badge?: number;
  onSelect: (id: string) => void;
  registerRef: RegisterRef<HTMLButtonElement>;
}

function NavRow({ item, active, badge, onSelect, registerRef }: NavRowProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      ref={(el) => {
        registerRef(item.id, el);
      }}
      onClick={() => {
        onSelect(item.id);
        if (item.href) router.push(item.href);
      }}
      // P1-E #28: hover background is the CSS `.nav-row-hoverable`
      // transition (was a GSAP backgroundColor tween, off-GPU). Only
      // non-active rows get the hover wash — the active row is pinned
      // under the pill.
      className={clsx(
        "relative z-10 flex w-full cursor-pointer items-center gap-1 rounded-md px-1 py-2 text-left",
        !active && "nav-row-hoverable"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        name={item.icon}
        size={20}
        className={active ? "text-ink" : "text-muted"}
      />
      <span
        className={clsx(
          "text-xs font-medium",
          active ? "text-ink" : "text-muted"
        )}
      >
        {item.label}
      </span>
      {/* Badge renders in every state: normal, hover, active */}
      {badge !== undefined && badge > 0 && (
        <Badge count={badge} tone="danger" className="ml-auto" />
      )}
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
  registerRowRef: RegisterRef<HTMLButtonElement>;
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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        aria-expanded={!collapsed}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span className="text-xs font-medium text-muted">
          {section.title}
        </span>
        {/* P1-E #28: chevron rotation is the CSS `.chevron-rot`
            transition (was a GSAP rotation tween). `rotate` is
            compositor-friendly. */}
        <span
          className={
            "chevron-rot inline-flex " +
            (collapsed ? "-rotate-90" : "rotate-0")
          }
        >
          <Icon name="chevron-down" size={20} className="text-muted" />
        </span>
      </button>
      {/* P1-E #28: section open/close is the grid-template-rows
          0fr<->1fr trick (CSS `.acc-wrap`/`.acc-inner`) instead of a
          GSAP height:0<->auto tween. Rows stay mounted so refs and
          pill measurements survive. */}
      <div className={collapsed ? "acc-wrap [grid-template-rows:0fr]" : "acc-wrap [grid-template-rows:1fr]"}>
        <div className="acc-inner flex flex-col gap-1">
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
  if (pathname.startsWith("/collaborations")) return "collaborations";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "feeds";
  return DEFAULT_ACTIVE_ID;
}

export function Sidebar() {
  const pathname = usePathname();
  // Route-aware active state: init from URL, sync on navigation.
  const [activeId, setActiveId] = useState(() => routeToNavId(pathname));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [inboxUnread, setInboxUnread] = useState(0);

  const areaRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const firstPill = useRef(true);

  // Sync activeId with pathname on navigation.
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

  // P1-E #28: the pill is positioned with `transform: translateY()` and
  // faded with `opacity` — the ONLY animated props — both compositor-only.
  // The CSS `.active-pill` transition animates them (jump on first mount).
  // Its fixed height (h-9) matches a standard nav row, so no `height`/`top`
  // layout tweens are needed (the old GSAP implementation animated top,
  // height, and opacity — all off-GPU / layout-triggering).
  const positionPill = () => {
    const area = areaRef.current;
    const pill = pillRef.current;
    if (!area || !pill) return;
    const row = rowRefs.current.get(activeId);
    if (!row) {
      pill.style.opacity = "0";
      return;
    }
    const y = row.getBoundingClientRect().top - area.getBoundingClientRect().top;
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
    // Re-measure the pill once the CSS accordion transition (300ms) settles,
    // so it follows the row to its new position. (The chevron rotation and
    // the open/close both run as pure CSS now — no GSAP.)
    window.setTimeout(() => positionPillRef.current(), 320);
  };

  const registerRow: RegisterRef<HTMLButtonElement> = (id, el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  return (
    <aside className="w-(--uf-sidebar-w) shrink-0 border-r-[0.5px] border-line bg-bg">
      <div
        ref={areaRef}
        className="relative flex h-full flex-col justify-between px-6 py-6"
      >
        <div
          ref={pillRef}
          className="active-pill absolute left-6 right-6 top-0 z-0 h-9 rounded-md bg-surface"
          style={{ opacity: 0 }}
        />

        <div className="flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* TODO(design): swap placeholder for the real logo asset */}
            <div className="h-[31px] w-[31px] rounded-sm bg-placeholder" />
            <span className="text-base font-medium">Stack Underflow</span>
          </div>

          {/* Nav sections */}
          <nav className="flex flex-col gap-6">
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

        {/* Footer */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
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
          <div className="h-px w-full bg-line" />

          {/* Profile card */}
          <div className="relative z-10 flex items-center justify-between rounded-sm bg-surface p-1">
            <div className="flex items-center gap-1">
              <Avatar size={28} rounded="sm" alt={CURRENT_USER.name} />
              <div className="flex w-[97px] flex-col gap-0.5">
                <span className="text-2xs font-medium">
                  {CURRENT_USER.name}
                </span>
                <span className="truncate text-2xs text-muted">
                  {CURRENT_USER.email}
                </span>
              </div>
            </div>
            <Icon name="chevrons-up-down" size={20} className="text-muted" />
          </div>
        </div>
      </div>
    </aside>
  );
}