"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export type TopBarVariant = "dashboard" | "detail";

interface TopBarProps {
  breadcrumbRoot?: string;
  breadcrumbLeaf?: string;
  backLabel?: string;
  backHref?: string;
  variant?: TopBarVariant;
  /** Page-specific right-side actions; rendered INSTEAD of the default Post button. */
  actions?: ReactNode;
}

const SCROLL_THRESHOLD = 24;

/* The breadcrumb is the log's running head: the root is a quiet pencil mark,
   the leaf is graphite at full weight, separated by a real slash — not a
   middle-dot meta string (banned). */
function Breadcrumb({ root, leaf }: { root: string; leaf: string }) {
  return (
    <p className="flex items-baseline gap-2 text-base">
      <span className="font-normal text-muted">{root}</span>
      <span aria-hidden="true" className="text-line">
        /
      </span>
      <span className="font-semibold text-ink">{leaf}</span>
    </p>
  );
}

export function TopBar({
  breadcrumbRoot = "Dashboard",
  breadcrumbLeaf = "Feed",
  backLabel = "Feed",
  backHref,
  variant = "dashboard",
  actions,
}: TopBarProps) {
  const router = useRouter();
  const barRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const scroller = bar.closest("main");
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > SCROLL_THRESHOLD);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-20 flex h-[72px] items-center justify-between bg-bg px-[42px]"
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={`Back to ${backLabel}`}
            className="pressable flex cursor-pointer items-center rounded-md text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Icon name="chevron-left" size={22} />
          </button>
        )}
        <Breadcrumb root={breadcrumbRoot} leaf={breadcrumbLeaf} />
      </div>

      <div className="flex items-center gap-6">{actions}</div>

      {/* The running head sits on a full rule: the bar is a line on the pad,
          not a floating surface. It appears once the content scrolls under. */}
      <span
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ink " +
          (variant === "detail" || scrolled ? "opacity-100" : "opacity-0") +
          " transition-opacity duration-200 motion-reduce:transition-none"
        }
      />
    </header>
  );
}