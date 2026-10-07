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

function Breadcrumb({ root, leaf }: { root: string; leaf: string }) {
  return (
    <p className="text-base text-ink">
      <span className="font-normal">{root}</span>
      <span className="font-normal"> / </span>
      <span className="font-medium">{leaf}</span>
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
  const borderRef = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // P2: border fade is now a CSS transition (GSAP dropped for trivial opacity)
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
      className="sticky top-0 z-20 flex h-[79px] items-center justify-between bg-bg px-[42px]"
    >
      <div className="flex items-center">
        {variant === "detail" ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label={`Back to ${backLabel}`}
            className="flex cursor-pointer items-center"
          >
            <Icon name="chevron-left" size={24} />
            <span className="text-base font-bold">{backLabel}</span>
          </button>
        ) : (
          <Breadcrumb root={breadcrumbRoot} leaf={breadcrumbLeaf} />
        )}
      </div>

      <div className="flex items-center gap-6">
        {actions ?? (
          <>
            {/* TODO(backend): open composer modal / POST /api/posts */}
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-md bg-accent p-2 transition-opacity hover:opacity-85"
            >
              <Icon name="plus" size={16} />
              <span className="text-sm font-medium">Post Something</span>
            </button>
          </>
        )}
      </div>

      <span
        ref={borderRef}
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line " +
          (variant === "detail"
            ? "opacity-100"
            : scrolled
              ? "opacity-100"
              : "opacity-0") +
          " transition-opacity duration-200 motion-reduce:transition-none"
        }
      />
    </header>
  );
}