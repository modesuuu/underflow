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
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useInboxUnreadCount } from "@/features/inbox/store";
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
//
// The sidebar itself collapses to a 76px icon rail (user request,
// 2026-10-13): the width animates on a 300ms Apple-style ease,
// labels clip away via max-width + opacity, and icon-only rows get
// hover tooltips. The preference persists in localStorage and
// Ctrl/Cmd+B toggles it. The stored value is applied in a layout
// effect, before first paint: AppShell is rendered per page, so
// the sidebar remounts on every navigation — a post-paint read
// would flash the expanded rail, then replay the collapse
// animation on each page change.

const RAIL_STORAGE_KEY = "uf-sidebar-mini";
const RAIL_WIDTH = 76;

/** Panel glyph for the rail toggle — the pictogram the user
 * picked: a rounded rect with a left panel and a content dash.
 * Drawn inline; boxicons has no sidebar glyph. */
function SidebarPanelIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
      <line x1="5.8" y1="12" x2="7.7" y2="12" strokeWidth="2.2" />
    </svg>
  );
}

type RegisterRef<T> = (id: string, el: T | null) => void;

/** When the last rail tooltip closed — a glide reuses a short delay. */
let lastTipClosedAt = 0;

interface NavRowProps {
  item: NavItem;
  active: boolean;
  badge?: number;
  mini?: boolean;
  animate?: boolean;
  onSelect: (id: string) => void;
  registerRef: RegisterRef<HTMLElement>;
}

function NavRow({ item, active, badge, mini, animate, onSelect, registerRef }: NavRowProps) {
  // Items with an href are real <Link> anchors — Next.js prefetches the
  // destination route shell on hover/appearance, so slow compiles no longer
  // flash the wrong skeleton first (button + router.push had no prefetch).
  // href-less items stay buttons. Either element is registered to the pill.
  // Rail tooltip state. The tooltip is portaled to <body>:
  // section rows live inside the accordion's .acc-inner, which
  // clips overflow — an in-flow tooltip can never escape the
  // sidebar from there. Only the footer rows (outside any
  // accordion) ever showed one; that asymmetry was the bug.
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [tipOpen, setTipOpen] = useState(false);
  const tipTimer = useRef<number | undefined>(undefined);
  const tipExitTimer = useRef<number | undefined>(undefined);
  const showTip = (el: HTMLElement) => {
    if (!mini) return;
    window.clearTimeout(tipTimer.current);
    window.clearTimeout(tipExitTimer.current);
    const open = () => {
      const r = el.getBoundingClientRect();
      setTipPos({ x: r.right + 12, y: r.top + r.height / 2 });
    };
    // Cold hover waits out the intent delay; gliding between
    // rows keeps only a breath of it — but the open ANIMATION
    // plays on every row (the user glides the rail top-to-bottom
    // and wants to see it each time; an earlier instant-neighbour
    // shortcut suppressed exactly that).
    const gliding = Date.now() - lastTipClosedAt < 600;
    tipTimer.current = window.setTimeout(open, gliding ? 70 : 300);
  };
  const hideTip = () => {
    window.clearTimeout(tipTimer.current);
    setTipOpen(false);
    lastTipClosedAt = Date.now();
    window.clearTimeout(tipExitTimer.current);
    tipExitTimer.current = window.setTimeout(() => setTipPos(null), 155);
  };
  // Flip to the open style one frame AFTER the tooltip mounts in
  // its closed style — effects run post-commit, so the transition
  // always gets a real starting point.
  useEffect(() => {
    if (!tipPos) return;
    const raf = requestAnimationFrame(() => setTipOpen(true));
    return () => cancelAnimationFrame(raf);
  }, [tipPos]);

  useEffect(
    () => () => {
      window.clearTimeout(tipTimer.current);
      window.clearTimeout(tipExitTimer.current);
    },
    [],
  );
  const tipHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
      showTip(e.currentTarget),
    onMouseLeave: hideTip,
    onFocus: (e: React.FocusEvent<HTMLElement>) =>
      showTip(e.currentTarget),
    onBlur: hideTip,
  };

  const className = clsx(
    "group relative z-10 flex w-full cursor-pointer items-center gap-1 rounded-md py-2 text-left",
    mini ? "pr-0 pl-4" : "px-1",
    animate &&
      "transition-[padding] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none",
    !active && "nav-row-hoverable"
  );

  const inner = (
    <>
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <Icon
          name={item.icon}
          size={20}
          className={(active ? "text-ink" : "text-muted") + " leading-none"}
        />
        {/* Mini rail: the unread count becomes a dot badge on the icon */}
        {mini && badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff383c] px-1 text-[9px] font-semibold text-white">
            {badge}
          </span>
        )}
      </span>
      <span
        className={clsx(
          "overflow-hidden text-xs leading-5 font-medium whitespace-nowrap",
          animate &&
            "transition-[max-width,opacity] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none",
          active ? "text-ink" : "text-muted",
          mini ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
        )}
      >
        {item.label}
      </span>
      {/* Badge renders in every state: normal, hover, active */}
      {!mini && badge !== undefined && badge > 0 && (
        <Badge count={badge} tone="danger" className="ml-auto" />
      )}
      {/* Tooltip — only on the icon rail; portaled so the
          accordion's overflow clip cannot eat it (see showTip). */}
      {mini &&
        tipPos &&
        createPortal(
          <span
            aria-hidden="true"
            data-open={tipOpen}
            style={{ left: tipPos.x, top: tipPos.y }}
            className="uf-tip pointer-events-none fixed z-[100] -translate-y-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
          >
            {item.label}
            {badge !== undefined && badge > 0 ? ` (${badge})` : ""}
          </span>,
          document.body,
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
        // P1-E #28: hover background is the CSS `.nav-row-hoverable`
        // transition (was a GSAP backgroundColor tween, off-GPU). Only
        // non-active rows get the hover wash — the active row is pinned
        // under the pill.
        {...tipHandlers}
        className={className}
        aria-current={active ? "page" : undefined}
        aria-label={mini ? item.label : undefined}
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
      {...tipHandlers}
      className={className}
      aria-current={active ? "page" : undefined}
      aria-label={mini ? item.label : undefined}
    >
      {inner}
    </button>
  );
}

interface NavSectionBlockProps {
  section: NavSection;
  activeId: string;
  collapsed: boolean;
  mini?: boolean;
  animate?: boolean;
  badgeFor: (id: string) => number | undefined;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  registerRowRef: RegisterRef<HTMLElement>;
}

function NavSectionBlock({
  section,
  activeId,
  collapsed,
  mini,
  animate,
  badgeFor,
  onToggle,
  onSelect,
  registerRowRef,
}: NavSectionBlockProps) {
  // On the icon rail the section header becomes a hairline divider
  // and the rows are always shown (an accordion makes no sense at
  // 76px — there is nothing to read).
  const sectionCollapsed = mini ? false : collapsed;
  return (
    <div className="flex flex-col gap-3">
      <div
        className={
          "relative " +
          (animate
            ? "transition-[height] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none"
            : "")
        }
        style={{ height: mini ? 1 : 20 }}
      >
        <button
          type="button"
          onClick={() => onToggle(section.id)}
          aria-expanded={!collapsed}
          aria-hidden={mini || undefined}
          tabIndex={mini ? -1 : undefined}
          className={
            "absolute inset-x-0 top-0 flex w-full cursor-pointer items-center justify-between text-left " +
            (animate ? "transition-opacity duration-200 " : "") +
            (mini ? "pointer-events-none opacity-0" : "opacity-100")
          }
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
            <Icon name="chevron-down" size={20} className="leading-none text-muted" />
          </span>
        </button>
        <div
          aria-hidden="true"
          className={
            "absolute inset-x-2 top-0 h-px bg-line " +
            (animate ? "transition-opacity delay-100 duration-300 " : "") +
            (mini ? "opacity-100" : "opacity-0")
          }
        />
      </div>
      {/* P1-E #28: section open/close is the grid-template-rows
          0fr<->1fr trick (CSS `.acc-wrap`/`.acc-inner`) instead of a
          GSAP height:0<->auto tween. Rows stay mounted so refs and
          pill measurements survive. */}
      <div className={sectionCollapsed ? "acc-wrap [grid-template-rows:0fr]" : "acc-wrap [grid-template-rows:1fr]"}>
        <div className="acc-inner flex flex-col gap-1">
          {section.items.map((item) => (
            <NavRow
              key={item.id}
              item={item}
              active={item.id === activeId}
              badge={badgeFor(item.id)}
              mini={mini}
              animate={animate}
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
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "feeds";
  return DEFAULT_ACTIVE_ID;
}

export function Sidebar() {
  const pathname = usePathname();
  // Route-aware active state: init from URL, sync on navigation.
  const [activeId, setActiveId] = useState(() => routeToNavId(pathname));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mini, setMini] = useState(false);
  const [animateWidth, setAnimateWidth] = useState(false);
  const inboxUnread = useInboxUnreadCount();

  const areaRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const firstPill = useRef(true);

  // Sync activeId with pathname on navigation.
  useEffect(() => {
    setActiveId(routeToNavId(pathname));
  }, [pathname]);

  // Apply the stored rail preference BEFORE the browser paints
  // (see the header note — this is what stops the collapse
  // animation replaying on every page change).
  useLayoutEffect(() => {
    try {
      if (window.localStorage.getItem(RAIL_STORAGE_KEY) === "1") {
        setMini(true);
      }
    } catch {
      // Storage unavailable (private mode) — the rail just won't persist.
    }
  }, []);

  // Arm the width transition a frame after mount: the stored
  // state above snaps in unanimated; every later toggle animates.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimateWidth(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleMini = () => {
    setMini((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(RAIL_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Non-fatal: persistence is a nicety, not the feature.
      }
      return next;
    });
  };

  // Ctrl/Cmd+B toggles the rail (VS Code convention) — never while
  // the user is typing in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "b") {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      toggleMini();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
  }, [activeId, activeVisible, mini]);

  // Keep the pill glued to its row through ANY layout motion —
  // accordion open/close, rail collapse (section headers swap for
  // dividers, sections force-expand): a ResizeObserver on the nav
  // stack re-measures whenever the stack's height changes, instead
  // of guessing a settle timeout and letting the pill trail late.
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => positionPillRef.current());
    observer.observe(stack);
    return () => observer.disconnect();
  }, []);

  const toggleSection = (id: string) => {
    const isCollapsed = !!collapsed[id];
    setCollapsed((prev) => ({ ...prev, [id]: !isCollapsed }));
    // Re-measure the pill once the CSS accordion transition (300ms) settles,
    // so it follows the row to its new position. (The chevron rotation and
    // the open/close both run as pure CSS now — no GSAP.)
    window.setTimeout(() => positionPillRef.current(), 320);
  };

  const registerRow: RegisterRef<HTMLElement> = (id, el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  return (
    <aside
      style={mini ? { width: RAIL_WIDTH } : undefined}
      className={clsx(
        "w-(--uf-sidebar-w) shrink-0 border-r-[0.5px] border-line bg-bg",
        animateWidth &&
          "transition-[width] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none"
      )}
    >
      <div
        ref={areaRef}
        className={clsx(
          "relative flex h-full flex-col justify-between py-6",
          mini ? "px-3" : "px-6",
          animateWidth &&
            "transition-[padding] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none",
          !animateWidth && "[&_.active-pill]:[transition:none]"
        )}
      >
        <div
          ref={pillRef}
          className={clsx(
            "active-pill absolute top-0 z-0 h-9 rounded-md bg-surface",
            mini ? "right-3 left-3" : "right-6 left-6"
          )}
          style={{ opacity: 0 }}
        />

        <div ref={stackRef} className="flex flex-col gap-6">
          {/* Brand + rail toggle: the panel-glyph button sits at
              the row's right edge, icon only (user placement). On
              the rail the brand cluster clips away and the button
              stays as the row's only element, centered. */}
          <div
            className={clsx(
              "flex items-center",
              mini ? "justify-center" : "gap-2"
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-3 overflow-hidden",
                animateWidth &&
                  "transition-[max-width,opacity] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none",
                mini ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"
              )}
            >
              {/* TODO(design): swap placeholder for the real logo asset */}
              <div className="h-[31px] w-[31px] shrink-0 rounded-sm bg-placeholder" />
              <span className="text-base font-medium whitespace-nowrap">
                Stack Underflow
              </span>
            </div>
            <button
              type="button"
              onClick={toggleMini}
              aria-expanded={!mini}
              aria-label={mini ? "Expand sidebar" : "Collapse sidebar"}
              title={mini ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              className={clsx(
                "group nav-row-hoverable relative z-10 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:text-ink",
                !mini && "ml-auto"
              )}
            >
              <SidebarPanelIcon />
              {mini && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 translate-x-[-4px] rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-300 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                >
                  Expand sidebar
                </span>
              )}
            </button>
          </div>

          {/* Nav sections */}
          <nav className="flex flex-col gap-6">
            {NAV_SECTIONS.map((section) => (
              <NavSectionBlock
                key={section.id}
                section={section}
                activeId={activeId}
                collapsed={!!collapsed[section.id]}
                mini={mini}
                animate={animateWidth}
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
                mini={mini}
                animate={animateWidth}
                onSelect={setActiveId}
                registerRef={registerRow}
              />
            ))}
          </div>
          <div className="h-px w-full bg-line" />

          {/* Profile card — links to the current user's own profile */}
          <Link
            href="/profile/me"
            aria-label="View your profile"
            className={clsx(
              "group relative z-10 flex cursor-pointer items-center rounded-sm bg-surface p-1",
              mini ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-1">
              <Avatar size={28} rounded="sm" alt={CURRENT_USER.name} />
              <div
                className={clsx(
                  "flex flex-col gap-0.5 overflow-hidden",
                  animateWidth &&
                    "transition-[max-width,opacity] duration-[380ms] ease-(--uf-ease-out) motion-reduce:transition-none",
                  mini ? "w-0 max-w-0 opacity-0" : "w-[97px] max-w-[97px] opacity-100"
                )}
              >
                <span className="text-2xs font-medium whitespace-nowrap">
                  {CURRENT_USER.name}
                </span>
                <span className="truncate text-2xs whitespace-nowrap text-muted">
                  {CURRENT_USER.email}
                </span>
              </div>
            </div>
            {!mini && (
              <Icon name="chevrons-up-down" size={20} className="text-muted" />
            )}
            {mini && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 translate-x-[-4px] rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-300"
              >
                {CURRENT_USER.name}
              </span>
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}
